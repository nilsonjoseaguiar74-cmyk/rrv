import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import pg from "pg";
import { chromium } from "playwright";
import { hashVerifyToken } from "../server/services/verify-auth.js";
import {
  EXECUTION_TIMEOUT_MS,
  getExecutionEvidencePath,
} from "../server/executors/playwright-local.js";
import { startVerifyExecutionWorker } from "../server/workers/verify-execution-worker.js";
import { closePool } from "../server/db.js";

const enabled = process.env.VERIFY_LIVE_TEST === "1";
const apiOrigin = process.env.VERIFY_LIVE_API_ORIGIN || "http://127.0.0.1:3100";
const apiHostname = new URL(apiOrigin).hostname;

test("live Verify API persists project records and enforces workspace sessions", {
  skip: !enabled,
}, async (context) => {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  const identityId = crypto.randomUUID();
  const otherIdentityId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();
  const otherWorkspaceId = crypto.randomUUID();
  const marker = crypto.randomUUID();
  let token = "";
  let connected = false;
  let stopWorker;
  let browser;
  const evidenceIds = new Set();
  const executionIds = new Set();
  const expectedExecutionResults = new Map();

  async function request(path, { method = "GET", body, sessionToken = token } = {}) {
    const response = await fetch(`${apiOrigin}/api/verify${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(sessionToken ? { Cookie: `rrv_verify_session=${sessionToken}` } : {}),
        Origin: process.env.ALLOWED_ORIGIN || "",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, payload: await response.json() };
  }

  async function createSession(sessionIdentityId = identityId) {
    token = crypto.randomBytes(32).toString("base64url");
    await client.query(
      "INSERT INTO verify_sessions (identity_id, token_hash, expires_at) VALUES ($1,$2,now()+interval '1 hour')",
      [sessionIdentityId, hashVerifyToken(token)],
    );
  }

  async function runAndWait(projectPath, requirementId, testKey) {
    const queued = await request(`${projectPath}/executions`, {
      method: "POST",
      body: { requirementId, testKey },
    });
    assert.equal(queued.status, 202, JSON.stringify(queued.payload));
    assert.equal(queued.payload.item.status, "queued");
    const executionId = queued.payload.item.id;
    executionIds.add(executionId);
    const deadline = Date.now() + EXECUTION_TIMEOUT_MS + 60_000;
    let completed;
    do {
      const current = await request(`/executions/${executionId}`);
      assert.equal(current.status, 200);
      completed = current.payload.item;
      if (["passed", "failed", "cancelled"].includes(completed.status)) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    } while (Date.now() < deadline);
    assert.equal(completed.status, "passed", JSON.stringify(completed));
    assert.equal(completed.testKey, testKey);
    assert.ok(completed.evidence);
    evidenceIds.add(completed.evidence.id);

    const databaseResult = await client.query(
      "SELECT status, results FROM verify_test_executions WHERE id = $1 AND workspace_id = $2",
      [executionId, workspaceId],
    );
    assert.equal(databaseResult.rows[0]?.status, "passed");
    assert.deepEqual(databaseResult.rows[0]?.results, completed.results);
    expectedExecutionResults.set(testKey, structuredClone(completed.results));

    const evidenceResponse = await fetch(`${apiOrigin}${completed.evidence.url}`, {
      headers: { Cookie: `rrv_verify_session=${token}` },
    });
    assert.equal(evidenceResponse.status, 200);
    assert.match(evidenceResponse.headers.get("content-type") || "", /image\/png/);
    const imageBytes = Buffer.from(await evidenceResponse.arrayBuffer());
    assert.equal(imageBytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(
      crypto.createHash("sha256").update(imageBytes).digest("hex"),
      completed.evidence.sha256,
    );
    assert.ok(imageBytes.length > 1000);
    return completed;
  }

  try {
    const target = client.connectionParameters;
    assert.equal(target.host, "127.0.0.1", "test may only use the local PostgreSQL endpoint");
    assert.equal(Number(target.port), 55432, "test may only use the Verify development port");
    assert.equal(target.database, "rrv_verify_dev", "test may only use the Verify development database");
    const origin = new URL(apiOrigin);
    assert.equal(origin.protocol, "http:");
    assert.ok(["127.0.0.1", "localhost"].includes(origin.hostname));
    assert.equal(origin.port, "3100");

    await client.connect();
    connected = true;
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO verify_identities (id,issuer,subject,email,display_name)
       VALUES ($1,'https://rrv.digital/verify/invite',$2,$3,'QA sintético'),
              ($4,'https://rrv.digital/verify/invite',$5,$6,'QA workspace isolado')`,
      [identityId, `${marker}-one`, `qa-${marker}@example.invalid`, otherIdentityId, `${marker}-two`, `qa-other-${marker}@example.invalid`],
    );
    await client.query(
      "INSERT INTO verify_workspaces (id,name) VALUES ($1,$2),($3,$4)",
      [workspaceId, `QA ${marker}`, otherWorkspaceId, `QA outro ${marker}`],
    );
    await client.query(
      "INSERT INTO verify_workspace_members (workspace_id,identity_id,role) VALUES ($1,$2,'owner')",
      [workspaceId, identityId],
    );
    await client.query(
      "INSERT INTO verify_workspace_members (workspace_id,identity_id,role) VALUES ($1,$2,'owner')",
      [otherWorkspaceId, otherIdentityId],
    );
    await client.query("COMMIT");
    await createSession();
    stopWorker = startVerifyExecutionWorker();

    const empty = await request(`/projects?workspaceId=${workspaceId}`);
    assert.equal(empty.status, 200);
    assert.equal(empty.payload.items.length, 0);

    const rejectedProject = await request("/projects", {
      method: "POST",
      body: {
        workspaceId,
        name: `Não deve persistir ${marker}`,
        description: "Teste atômico",
        referenceUrl: "",
        requirements: [
          { objective: "Objetivo", description: "Requisito", acceptanceCriterion: "Critério" },
          { objective: "Objetivo inválido", description: "Falta critério" },
        ],
      },
    });
    assert.equal(rejectedProject.status, 400);
    assert.equal((await request(`/projects?workspaceId=${workspaceId}`)).payload.items.length, 0);

    const created = await request("/projects", {
      method: "POST",
      body: {
        workspaceId,
        name: `Projeto QA ${marker}`,
        description: "Fixture sintética; nenhuma validação de software foi executada.",
        referenceUrl: "https://example.test/rrv-verify",
        requirements: [
          {
            objective: "Objetivo A",
            description: "Requisito A",
            acceptanceCriterion: "Critério A",
            verificationMethod: "Inspeção manual",
            moduleKey: "M01",
            sortOrder: 0,
          },
          {
            objective: "Objetivo B",
            description: "Requisito B",
            acceptanceCriterion: "Critério B",
            verificationMethod: "Revisão manual",
            moduleKey: "M03",
            sortOrder: 1,
          },
        ],
      },
    });
    assert.equal(created.status, 201);
    const project = created.payload.item;
    const projectPath = `/projects/${project.id}`;
    const requirements = await request(`${projectPath}/requirements?workspaceId=${workspaceId}`);
    assert.equal(requirements.status, 200);
    assert.equal(requirements.payload.items.length, 2);
    assert.equal(requirements.payload.items[1].acceptanceCriterion, "Critério B");
    const projectLookup = await request(`${projectPath}?workspaceId=${workspaceId}`);
    assert.equal(projectLookup.status, 200);
    assert.equal(projectLookup.payload.item.id, project.id);

    const versionResponse = await request(`${projectPath}/versions`, {
      method: "POST",
      body: { workspaceId, label: "QA v1", summary: "Fixture sintética", deliveredAt: "2026-03-20" },
    });
    assert.equal(versionResponse.status, 201);
    const version = versionResponse.payload.item;
    const versions = await request(`${projectPath}/versions?workspaceId=${workspaceId}`);
    assert.equal(versions.status, 200);
    assert.equal(versions.payload.items[0].id, version.id);

    const invalidRequirementResult = await request(`${projectPath}/validations`, {
      method: "POST",
      body: {
        workspaceId,
        requirementId: crypto.randomUUID(),
        versionId: version.id,
        status: "passed",
        summary: "Deve ser rejeitado; requisito não pertence ao projeto.",
      },
    });
    assert.equal(invalidRequirementResult.status, 404);

    const validationResponse = await request(`${projectPath}/validations`, {
      method: "POST",
      body: {
        workspaceId,
        requirementId: requirements.payload.items[0].id,
        versionId: version.id,
        status: "passed",
        summary: "Estado manual sintético para testar persistência.",
        evidence: {
          title: "Evidência sintética",
          url: "https://example.test/qa-evidence",
          notes: "Referência criada apenas para este teste.",
        },
      },
    });
    assert.equal(validationResponse.status, 201);
    assert.equal(validationResponse.payload.item.evidence.length, 1);
    const validations = await request(`${projectPath}/validations?workspaceId=${workspaceId}`);
    assert.equal(validations.status, 200);
    assert.equal(validations.payload.items[0].evidence.length, 1);

    const update = await request(projectPath, {
      method: "PATCH",
      body: {
        workspaceId,
        name: `Projeto QA atualizado ${marker}`,
        description: "Atualizado e persistente.",
        referenceUrl: "https://example.test/updated",
      },
    });
    assert.equal(update.status, 200);
    assert.equal(update.payload.item.description, "Atualizado e persistente.");
    const history = await request(`${projectPath}/history?workspaceId=${workspaceId}`);
    assert.equal(history.status, 200);
    assert.ok(history.payload.items.some((entry) => entry.action === "evidence.created"));
    const denied = await request(`${projectPath}?workspaceId=${otherWorkspaceId}`);
    assert.ok([403, 404].includes(denied.status));

    const unsafeExecutionRequest = await request(`${projectPath}/executions`, {
      method: "POST",
      body: {
        requirementId: requirements.payload.items[0].id,
        testKey: "local-page-smoke",
        url: "http://127.0.0.1:5432/",
      },
    });
    assert.equal(unsafeExecutionRequest.status, 400);
    const unsupportedEngine = await request(`${projectPath}/executions`, {
      method: "POST",
      body: {
        requirementId: requirements.payload.items[0].id,
        testKey: "http://127.0.0.1:5432/",
      },
    });
    assert.equal(unsupportedEngine.status, 400);

    const functional = await runAndWait(projectPath, requirements.payload.items[0].id, "local-page-smoke");
    assert.equal(functional.results[0].browser, "Chromium");
    assert.ok(functional.results[0].assertions.length >= 2);
    assert.ok(functional.results[0].assertions.every((item) => item.passed));

    const lighthouseExecution = await runAndWait(projectPath, requirements.payload.items[0].id, "local-lighthouse-audit");
    const lighthouseReport = lighthouseExecution.results[0].lighthouse;
    assert.equal(typeof lighthouseReport.version, "string");
    assert.deepEqual(
      Object.keys(lighthouseReport.categories).sort(),
      ["accessibility", "best-practices", "performance", "seo"].sort(),
    );
    assert.ok(lighthouseReport.metrics.some((metric) => metric.id === "largest-contentful-paint"));
    assert.ok(lighthouseReport.audits.length > 20);
    context.diagnostic(
      `Lighthouse ${lighthouseReport.version} stored four category scores, ${lighthouseReport.metrics.length} metrics, and ${lighthouseReport.audits.length} audit results.`,
    );

    const axeExecution = await runAndWait(projectPath, requirements.payload.items[0].id, "local-axe-audit");
    const axeReport = axeExecution.results[0].axe;
    assert.equal(typeof axeReport.version, "string");
    assert.ok(axeReport.violationsCount > 0);
    assert.ok(axeReport.violations.some((violation) => violation.id === "button-name"));
    assert.ok(axeReport.violations.some((violation) => violation.criteria.length > 0));
    assert.ok(axeReport.violations.some((violation) => violation.nodes.some((node) => node.target.length > 0)));
    assert.equal(axeExecution.results[0].analysis?.status, "available");
    assert.equal(axeExecution.results[0].analysis?.model, "qwen2.5:1.5b");
    assert.ok(axeExecution.results[0].analysis?.summary);
    context.diagnostic(
      `axe-core ${axeReport.version} found ${axeReport.violationsCount} real violations, including button-name; results include WCAG criteria and element selectors.`,
    );

    const unauthorizedEvidence = await request(`/executions/${functional.id}/evidence`, {
      sessionToken: crypto.randomBytes(32).toString("base64url"),
    });
    assert.equal(unauthorizedEvidence.status, 401);
    await createSession(otherIdentityId);
    for (const executionId of executionIds) {
      assert.equal((await request(`/executions/${executionId}`)).status, 404);
      assert.equal((await request(`/executions/${executionId}/evidence`)).status, 404);
    }
    await createSession();

    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-background-networking"],
    });
    const uiContext = await browser.newContext();
    await uiContext.addCookies([{
      name: "rrv_verify_session",
      value: token,
      domain: apiHostname,
      path: "/api/verify",
      httpOnly: true,
      sameSite: "Strict",
    }]);
    await uiContext.route("**/*", (route) => {
      if (new URL(route.request().url()).origin !== apiOrigin) return route.abort("blockedbyclient");
      return route.continue();
    });
    const dashboard = await uiContext.newPage();
    await dashboard.goto(`${apiOrigin}/start/verify/validations`, { waitUntil: "domcontentloaded" });
    await dashboard.getByText("Verificações automatizadas").waitFor({ state: "visible", timeout: 15_000 });
    await dashboard.getByText("Playwright · Teste funcional · Chromium").waitFor({ state: "visible", timeout: 15_000 });
    await dashboard.getByText("Lighthouse · Qualidade da página · Chromium").waitFor({ state: "visible", timeout: 15_000 });
    await dashboard.getByText("axe-core · Acessibilidade · Chromium").waitFor({ state: "visible", timeout: 15_000 });
    await dashboard.getByText("Critérios WCAG relacionados:", { exact: false }).first().waitFor({ state: "visible", timeout: 15_000 });
    await dashboard.getByText(axeExecution.results[0].analysis.summary, { exact: true }).waitFor({ state: "visible", timeout: 15_000 });
    await dashboard.getByRole("link", { name: /Abrir screenshot PNG/ }).first().waitFor({ state: "visible", timeout: 15_000 });
    await browser.close();
    browser = undefined;

    const queuedForCancellation = await request(`${projectPath}/executions`, {
      method: "POST",
      body: {
        requirementId: requirements.payload.items[0].id,
        testKey: "local-page-smoke",
      },
    });
    assert.equal(queuedForCancellation.status, 202);
    const cancelRequest = await request(`/executions/${queuedForCancellation.payload.item.id}/cancel`, {
      method: "POST",
      body: {},
    });
    assert.ok(["cancelled", "running"].includes(cancelRequest.payload.item.status));
    const cancellationDeadline = Date.now() + 10_000;
    let cancellationResult = cancelRequest.payload.item;
    while (cancellationResult.status !== "cancelled" && Date.now() < cancellationDeadline) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      cancellationResult = (await request(`/executions/${queuedForCancellation.payload.item.id}`)).payload.item;
    }
    assert.equal(cancellationResult.status, "cancelled");
    context.diagnostic("Queued/running execution cancellation returned and persisted cancelled status.");

    await request("/auth/logout", { method: "POST", body: {} });
    assert.equal((await request("/auth/session")).status, 401);
    await createSession();
    assert.equal((await request("/auth/session")).status, 200);
    assert.equal((await request(`/projects?workspaceId=${workspaceId}`)).payload.items.length, 1);
    assert.equal((await request(`${projectPath}/requirements?workspaceId=${workspaceId}`)).payload.items.length, 2);
    assert.equal((await request(`${projectPath}/versions?workspaceId=${workspaceId}`)).payload.items.length, 1);
    assert.equal((await request(`${projectPath}/validations?workspaceId=${workspaceId}`)).payload.items.length, 1);
    assert.ok((await request(`${projectPath}/history?workspaceId=${workspaceId}`)).payload.items.length >= 5);
    const executionsAfterLogin = await request(`${projectPath}/executions`);
    assert.equal(executionsAfterLogin.status, 200);
    for (const executionId of executionIds) {
      const persistedExecution = executionsAfterLogin.payload.items.find((item) => item.id === executionId);
      assert.equal(persistedExecution?.status, "passed");
      assert.ok(persistedExecution?.results.length);
      assert.deepEqual(
        persistedExecution?.results,
        expectedExecutionResults.get(persistedExecution?.testKey),
      );
    }

    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-background-networking"],
    });
    const reportContext = await browser.newContext();
    await reportContext.addCookies([{
      name: "rrv_verify_session",
      value: token,
      domain: apiHostname,
      path: "/api/verify",
      httpOnly: true,
      sameSite: "Strict",
    }]);
    await reportContext.route("**/*", (route) => {
      if (new URL(route.request().url()).origin !== apiOrigin) return route.abort("blockedbyclient");
      return route.continue();
    });
    const reportPage = await reportContext.newPage();
    await reportPage.goto(`${apiOrigin}/start/verify/reports`, { waitUntil: "domcontentloaded" });
    await reportPage.getByText("Relatórios automatizados").waitFor({ state: "visible", timeout: 15_000 });
    const completedReports = reportPage.getByRole("article").filter({ hasText: "Concluído" });
    await completedReports.filter({ hasText: "Playwright · Teste funcional" }).waitFor({ state: "visible", timeout: 15_000 });
    await completedReports.filter({ hasText: "Lighthouse · Qualidade da página" }).waitFor({ state: "visible", timeout: 15_000 });
    await completedReports.filter({ hasText: "axe-core · Acessibilidade" }).waitFor({ state: "visible", timeout: 15_000 });
    await reportPage.getByText(axeExecution.results[0].analysis.summary, { exact: true }).waitFor({ state: "visible", timeout: 15_000 });
    const downloadPromise = reportPage.waitForEvent("download");
    await reportPage.getByRole("button", { name: "Exportar JSON" }).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    assert.ok(downloadPath);
    const exportedReport = JSON.parse(await fs.readFile(downloadPath, "utf8"));
    assert.ok(exportedReport.automatedExecutions.length >= 3);
    const exportedAxe = exportedReport.automatedExecutions.find((item) => item.testKey === "local-axe-audit");
    assert.deepEqual(exportedAxe?.results, expectedExecutionResults.get("local-axe-audit"));
    assert.equal(exportedAxe?.results[0]?.analysis?.status, "available");
    await browser.close();
    browser = undefined;
  } finally {
    await stopWorker?.();
    await closePool();
    await browser?.close().catch(() => {});
    if (connected) {
      await client.query("ROLLBACK").catch(() => {});
      await client.query("DELETE FROM verify_workspaces WHERE id = $1 OR id = $2", [workspaceId, otherWorkspaceId]).catch(() => {});
      await client.query("DELETE FROM verify_identities WHERE id = $1 OR id = $2", [identityId, otherIdentityId]).catch(() => {});
      await client.end().catch(() => {});
    }
    await Promise.all([...evidenceIds].map((evidenceId) =>
      fs.unlink(getExecutionEvidencePath(evidenceId)).catch(() => {}),
    ));
  }
});
