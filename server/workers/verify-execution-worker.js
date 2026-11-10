import fs from "node:fs/promises";
import { query, transaction } from "../db.js";
import {
  EXECUTION_TIMEOUT_MS,
  getExecutionEvidencePath,
  runLocalPageSmoke,
} from "../executors/playwright-local.js";
import { QUALITY_AUDITS, runLocalQualityAudit } from "../executors/quality-audits.js";
import { interpretVerifyResults } from "../services/verify-analysis.js";

const POLL_INTERVAL_MS = 500;
const activeExecutions = new Map();
let workerStarted = false;
let workerStopped = false;
let pollTimer;
let pollPromise;

export function requestExecutionCancellation(executionId) {
  activeExecutions.get(executionId)?.abortController.abort();
}

async function claimNextExecution() {
  return transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(2084470001, 1)");
    await client.query(
      `UPDATE verify_test_executions
       SET status = 'failed', error_message = 'Worker reiniciado durante a execução.',
           completed_at = now()
       WHERE status = 'running' AND started_at < now() - interval '3 minutes'`,
    );
    const active = await client.query(
      "SELECT 1 FROM verify_test_executions WHERE status = 'running' LIMIT 1",
    );
    if (active.rows.length) return null;
    const result = await client.query(
      `WITH next_execution AS (
         SELECT id
         FROM verify_test_executions
         WHERE status = 'queued'
         ORDER BY created_at
         FOR UPDATE SKIP LOCKED
         LIMIT 1
       )
       UPDATE verify_test_executions AS execution
       SET status = 'running', started_at = now()
       FROM next_execution
       WHERE execution.id = next_execution.id AND execution.status = 'queued'
       RETURNING execution.id, execution.workspace_id, execution.project_id,
               execution.requirement_id, execution.initiated_by, execution.test_key`,
    );
    return result.rows[0] || null;
  });
}

async function completeExecution(execution, result) {
  let evidencePath;
  if (result.evidence) {
    evidencePath = getExecutionEvidencePath(result.evidence.id);
  }
  try {
    await transaction(async (client) => {
      const state = await client.query(
        `SELECT status, cancel_requested_at FROM verify_test_executions
         WHERE id = $1 AND workspace_id = $2 AND project_id = $3
         FOR UPDATE`,
        [execution.id, execution.workspace_id, execution.project_id],
      );
      if (!state.rows[0] || state.rows[0].status !== "running") return;
      if (state.rows[0].cancel_requested_at) {
        await client.query(
          `UPDATE verify_test_executions
           SET status = 'cancelled', completed_at = now()
           WHERE id = $1 AND status = 'running'`,
          [execution.id],
        );
        return;
      }
      if (result.evidence) {
        await client.query(
          `INSERT INTO verify_execution_evidence
             (id, workspace_id, project_id, execution_id, media_type, byte_length, sha256)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            result.evidence.id,
            execution.workspace_id,
            execution.project_id,
            execution.id,
            result.evidence.mediaType,
            result.evidence.byteLength,
            result.evidence.sha256,
          ],
        );
      }
      await client.query(
        `UPDATE verify_test_executions
         SET status = $2, results = $3::jsonb, error_message = $4, completed_at = now()
         WHERE id = $1 AND status = 'running'`,
        [execution.id, result.status, JSON.stringify(result.results), result.errorMessage || null],
      );
      await client.query(
        `INSERT INTO verify_change_history
           (workspace_id, project_id, requirement_id, actor_identity_id, action, details)
         VALUES ($1, $2, $3, $4, 'execution.completed', $5::jsonb)`,
        [
          execution.workspace_id,
          execution.project_id,
          execution.requirement_id,
          execution.initiated_by,
          JSON.stringify({ executionId: execution.id, status: result.status }),
        ],
      );
    });
  } catch (error) {
    if (evidencePath) await fs.unlink(evidencePath).catch(() => {});
    throw error;
  }
  const state = await query(
    "SELECT status FROM verify_test_executions WHERE id = $1",
    [execution.id],
  );
  if (state.rows[0]?.status === "cancelled" && evidencePath) {
    await fs.unlink(evidencePath).catch(() => {});
  }
}

async function runExecution(execution) {
  const abortController = new AbortController();
  const active = { abortController };
  activeExecutions.set(execution.id, active);
  const timeout = setTimeout(() => {
    active.timedOut = true;
    abortController.abort();
  }, EXECUTION_TIMEOUT_MS);
  try {
    const result = execution.test_key === "local-page-smoke"
      ? await runLocalPageSmoke({ signal: abortController.signal })
      : await runLocalQualityAudit(execution.test_key, { signal: abortController.signal });
    if (result.results.length) {
      const analysis = await interpretVerifyResults(result.results, { signal: abortController.signal });
      result.results = result.results.map((item, index) =>
        index === 0 ? { ...item, analysis } : item,
      );
    }
    const cancelled = await query(
      `SELECT cancel_requested_at FROM verify_test_executions
       WHERE id = $1 AND status = 'running'`,
      [execution.id],
    );
    if (active.timedOut) {
      await completeExecution(execution, {
        status: "failed",
        results: [{
          testKey: execution.test_key,
          label: QUALITY_AUDITS[execution.test_key]?.label,
          assertions: [],
          message: "Execução excedeu o limite de tempo.",
        }],
        errorMessage: "Execução excedeu o limite de tempo.",
      });
    } else if (abortController.signal.aborted || cancelled.rows[0]?.cancel_requested_at) {
      await completeExecution(execution, { status: "cancelled", results: [], errorMessage: null });
    } else {
      await completeExecution(execution, result);
    }
  } catch (error) {
    const cancelled = await query(
      `SELECT cancel_requested_at FROM verify_test_executions
       WHERE id = $1 AND status = 'running'`,
      [execution.id],
    ).catch(() => ({ rows: [] }));
    if (abortController.signal.aborted && !active.timedOut || cancelled.rows[0]?.cancel_requested_at) {
      await completeExecution(execution, { status: "cancelled", results: [], errorMessage: null });
    } else {
      await completeExecution(execution, {
        status: "failed",
        results: [{
          testKey: execution.test_key,
          label: QUALITY_AUDITS[execution.test_key]?.label,
          error: "A ferramenta não conseguiu concluir a verificação local.",
        }],
        errorMessage: active.timedOut ? "Execução excedeu o limite de tempo." : "Não foi possível iniciar o teste local.",
      });
    }
    if (error?.name !== "AbortError") {
      console.error("verify_execution_failed", { executionId: execution.id });
    }
  } finally {
    clearTimeout(timeout);
    activeExecutions.delete(execution.id);
  }
}

async function poll() {
  if (workerStopped) return;
  try {
    const execution = await claimNextExecution();
    if (execution) await runExecution(execution);
  } catch {
    console.error("verify_execution_worker_poll_failed");
  } finally {
    if (!workerStopped) {
      pollTimer = setTimeout(() => {
        pollPromise = poll();
      }, POLL_INTERVAL_MS);
      pollTimer.unref();
    }
  }
}

export function startVerifyExecutionWorker() {
  if (workerStarted) return () => stopVerifyExecutionWorker();
  workerStarted = true;
  workerStopped = false;
  pollPromise = poll();
  return stopVerifyExecutionWorker;
}

export async function stopVerifyExecutionWorker() {
  workerStopped = true;
  clearTimeout(pollTimer);
  for (const active of activeExecutions.values()) active.abortController.abort();
  await pollPromise;
  pollPromise = undefined;
  workerStarted = false;
}
