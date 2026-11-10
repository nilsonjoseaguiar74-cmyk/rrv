import { query, transaction } from "../db.js";
import { LOCAL_PAGE_SMOKE_TEST } from "../executors/playwright-local.js";
import { QUALITY_AUDITS } from "../executors/quality-audits.js";
import { VerifyError, requireUuid } from "./verify.js";
import { requestExecutionCancellation } from "../workers/verify-execution-worker.js";

const READ_ROLES = ["owner", "admin", "editor", "viewer"];
const WRITE_ROLES = ["owner", "admin", "editor"];
const SUPPORTED_TEST_KEYS = new Set([LOCAL_PAGE_SMOKE_TEST, ...Object.keys(QUALITY_AUDITS)]);

function assertIdentity(identity) {
  if (!identity || identity.active !== true) {
    throw new VerifyError(401, "Autenticação do Verify obrigatória.", "VERIFY_IDENTITY_REQUIRED");
  }
}

async function findProjectWorkspace(identity, projectId, write) {
  assertIdentity(identity);
  requireUuid(projectId, "projectId");
  const roles = write ? WRITE_ROLES : READ_ROLES;
  const result = await query(
    `SELECT project.workspace_id AS "workspaceId"
     FROM verify_projects AS project
     JOIN verify_workspace_members AS member
       ON member.workspace_id = project.workspace_id
      AND member.identity_id = $2
      AND member.role = ANY($3::verify_workspace_role[])
     JOIN verify_identities AS identity
       ON identity.id = member.identity_id AND identity.is_active = true
     WHERE project.id = $1`,
    [projectId, identity.id, roles],
  );
  if (!result.rows[0]) {
    throw new VerifyError(404, "Projeto não encontrado ou sem acesso.", "PROJECT_NOT_FOUND");
  }
  return result.rows[0].workspaceId;
}

function mapExecution(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    requirementId: row.requirement_id,
    testKey: row.test_key,
    status: row.status,
    results: row.results,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    evidence: row.evidence_id ? {
      id: row.evidence_id,
      mediaType: row.media_type,
      byteLength: row.byte_length,
      sha256: row.sha256,
      url: `/api/verify/executions/${row.id}/evidence`,
      createdAt: row.evidence_created_at,
    } : null,
  };
}

const EXECUTION_SELECT = `
  SELECT execution.id, execution.project_id, execution.requirement_id,
         execution.test_key, execution.status, execution.results,
         execution.error_message, execution.created_at, execution.started_at,
         execution.completed_at, evidence.id AS evidence_id,
         evidence.media_type, evidence.byte_length, evidence.sha256,
         evidence.created_at AS evidence_created_at
  FROM verify_test_executions AS execution
  LEFT JOIN verify_execution_evidence AS evidence
    ON evidence.workspace_id = execution.workspace_id
   AND evidence.project_id = execution.project_id
   AND evidence.execution_id = execution.id
`;

export async function enqueueVerifyExecution(identity, projectId, input) {
  const workspaceId = await findProjectWorkspace(identity, projectId, true);
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new VerifyError(400, "Corpo da solicitação inválido.", "INVALID_BODY");
  }
  if (Object.keys(input).some((key) => !["requirementId", "testKey"].includes(key))) {
    throw new VerifyError(400, "Campo de execução não permitido.", "UNKNOWN_FIELD");
  }
  const requirementId = requireUuid(input.requirementId, "requirementId");
  if (!SUPPORTED_TEST_KEYS.has(input.testKey)) {
    throw new VerifyError(400, "Tipo de teste indisponível.", "INVALID_TEST_KEY");
  }

  return transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [workspaceId]);
    const requirement = await client.query(
      `SELECT id FROM verify_requirements
       WHERE id = $1 AND workspace_id = $2 AND project_id = $3`,
      [requirementId, workspaceId, projectId],
    );
    if (!requirement.rows[0]) {
      throw new VerifyError(404, "Requisito não encontrado neste projeto.", "REQUIREMENT_NOT_FOUND");
    }
    const activeCount = await client.query(
      `SELECT count(*)::integer AS count FROM verify_test_executions
       WHERE workspace_id = $1 AND status IN ('queued', 'running')`,
      [workspaceId],
    );
    if (activeCount.rows[0].count >= 5) {
      throw new VerifyError(429, "Limite de execuções pendentes atingido para este workspace.", "EXECUTION_QUEUE_FULL");
    }
    const inserted = await client.query(
      `INSERT INTO verify_test_executions
         (workspace_id, project_id, requirement_id, initiated_by, test_key)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, project_id, requirement_id, test_key, status, results,
                 error_message, created_at, started_at, completed_at`,
      [workspaceId, projectId, requirementId, identity.id, input.testKey],
    );
    await client.query(
      `INSERT INTO verify_change_history
         (workspace_id, project_id, requirement_id, actor_identity_id, action, details)
       VALUES ($1, $2, $3, $4, 'execution.queued', $5::jsonb)`,
      [workspaceId, projectId, requirementId, identity.id, JSON.stringify({ executionId: inserted.rows[0].id, testKey: input.testKey })],
    );
    return mapExecution(inserted.rows[0]);
  });
}

export async function listVerifyExecutions(identity, projectId) {
  const workspaceId = await findProjectWorkspace(identity, projectId, false);
  const result = await query(
    `${EXECUTION_SELECT}
     WHERE execution.workspace_id = $1 AND execution.project_id = $2
     ORDER BY execution.created_at DESC
     LIMIT 50`,
    [workspaceId, projectId],
  );
  return result.rows.map(mapExecution);
}

export async function getVerifyExecution(identity, executionId) {
  assertIdentity(identity);
  requireUuid(executionId, "executionId");
  const result = await query(
    `${EXECUTION_SELECT}
     JOIN verify_workspace_members AS member
       ON member.workspace_id = execution.workspace_id
      AND member.identity_id = $2
     JOIN verify_identities AS identity
       ON identity.id = member.identity_id AND identity.is_active = true
     WHERE execution.id = $1 AND member.role = ANY($3::verify_workspace_role[])`,
    [executionId, identity.id, READ_ROLES],
  );
  if (!result.rows[0]) {
    throw new VerifyError(404, "Execução não encontrada.", "EXECUTION_NOT_FOUND");
  }
  return mapExecution(result.rows[0]);
}

export async function cancelVerifyExecution(identity, executionId) {
  assertIdentity(identity);
  requireUuid(executionId, "executionId");
  const result = await transaction(async (client) => {
    const updated = await client.query(
      `UPDATE verify_test_executions AS execution
       SET status = CASE WHEN execution.status = 'queued' THEN 'cancelled' ELSE execution.status END,
           cancel_requested_at = CASE WHEN execution.status = 'running' THEN now() ELSE execution.cancel_requested_at END,
           completed_at = CASE WHEN execution.status = 'queued' THEN now() ELSE execution.completed_at END
       FROM verify_workspace_members AS member
       JOIN verify_identities AS identity
         ON identity.id = member.identity_id AND identity.is_active = true
       WHERE execution.id = $1
         AND member.workspace_id = execution.workspace_id
         AND member.identity_id = $2
         AND member.role = ANY($3::verify_workspace_role[])
         AND execution.status IN ('queued', 'running')
       RETURNING execution.id, execution.workspace_id, execution.project_id,
                 execution.requirement_id, execution.status`,
      [executionId, identity.id, WRITE_ROLES],
    );
    if (!updated.rows[0]) return null;
    await client.query(
      `INSERT INTO verify_change_history
         (workspace_id, project_id, requirement_id, actor_identity_id, action, details)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        updated.rows[0].workspace_id,
        updated.rows[0].project_id,
        updated.rows[0].requirement_id,
        identity.id,
        updated.rows[0].status === "cancelled" ? "execution.cancelled" : "execution.cancel_requested",
        JSON.stringify({ executionId }),
      ],
    );
    return updated.rows[0];
  });
  if (!result) return getVerifyExecution(identity, executionId);
  if (result.status === "running") requestExecutionCancellation(executionId);
  return getVerifyExecution(identity, executionId);
}

export async function getVerifyExecutionEvidence(identity, executionId) {
  assertIdentity(identity);
  requireUuid(executionId, "executionId");
  const result = await query(
    `SELECT evidence.id, evidence.media_type, evidence.byte_length, evidence.sha256
     FROM verify_execution_evidence AS evidence
     JOIN verify_workspace_members AS member
       ON member.workspace_id = evidence.workspace_id
      AND member.identity_id = $2
     JOIN verify_identities AS identity
       ON identity.id = member.identity_id AND identity.is_active = true
     WHERE evidence.execution_id = $1
       AND member.role = ANY($3::verify_workspace_role[])
     LIMIT 1`,
    [executionId, identity.id, READ_ROLES],
  );
  if (!result.rows[0]) {
    throw new VerifyError(404, "Evidência não encontrada.", "EVIDENCE_NOT_FOUND");
  }
  return result.rows[0];
}
