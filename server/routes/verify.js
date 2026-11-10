import { Router } from "express";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { isVerifyIdentity, requireVerifyIdentity } from "../middleware/verify-identity.js";
import { getExecutionEvidencePath } from "../executors/playwright-local.js";
import {
  VerifyError,
  createProject,
  createRequirement,
  createValidation,
  createVersion,
  getProject,
  listProjectHistory,
  listProjects,
  listRequirements,
  listValidations,
  listVersions,
  requireUuid,
  updateProject,
} from "../services/verify.js";
import {
  cancelVerifyExecution,
  enqueueVerifyExecution,
  getVerifyExecution,
  getVerifyExecutionEvidence,
  listVerifyExecutions,
} from "../services/verify-executions.js";

export const verifyRouter = createVerifyRouter();

export function createVerifyRouter(service = {
  createProject,
  createRequirement,
  createValidation,
  createVersion,
  getProject,
  listProjectHistory,
  listProjects,
  listRequirements,
  listValidations,
  listVersions,
  updateProject,
  enqueueVerifyExecution,
  listVerifyExecutions,
  getVerifyExecution,
  cancelVerifyExecution,
  getVerifyExecutionEvidence,
}) {
  const router = Router();
  router.use(requireVerifyIdentity);

  router.get("/projects", asyncRoute(async (request, response) => {
    const workspaceId = requireUuid(request.query.workspaceId, "workspaceId");
    response.json({ items: await service.listProjects(request.verifyIdentity, workspaceId) });
  }));
  router.post("/projects", asyncRoute(async (request, response) => {
    const workspaceId = requireUuid(request.body?.workspaceId, "workspaceId");
    const item = await service.createProject(
      request.verifyIdentity,
      workspaceId,
      withoutWorkspaceId(request.body),
    );
    response.status(201).json({ item });
  }));
  router.get("/projects/:projectId", asyncRoute(async (request, response) => {
    const workspaceId = requireUuid(request.query.workspaceId, "workspaceId");
    const projectId = requireUuid(request.params.projectId, "projectId");
    const item = await service.getProject(request.verifyIdentity, workspaceId, projectId);
    if (!item) throw new VerifyError(404, "Projeto não encontrado.", "PROJECT_NOT_FOUND");
    response.json({ item });
  }));
  router.patch("/projects/:projectId", asyncRoute(async (request, response) => {
    const workspaceId = requireUuid(request.body?.workspaceId, "workspaceId");
    const projectId = requireUuid(request.params.projectId, "projectId");
    response.json({
      item: await service.updateProject(
        request.verifyIdentity,
        workspaceId,
        projectId,
        withoutWorkspaceId(request.body),
      ),
    });
  }));
  router.get("/projects/:projectId/requirements", asyncRoute(async (request, response) => {
    const workspaceId = requireUuid(request.query.workspaceId, "workspaceId");
    const projectId = requireUuid(request.params.projectId, "projectId");
    response.json({
      items: await service.listRequirements(request.verifyIdentity, workspaceId, projectId),
    });
  }));
  router.post("/projects/:projectId/requirements", asyncRoute(async (request, response) => {
    const workspaceId = requireUuid(request.body?.workspaceId, "workspaceId");
    const projectId = requireUuid(request.params.projectId, "projectId");
    response.status(201).json({
      item: await service.createRequirement(
        request.verifyIdentity,
        workspaceId,
        projectId,
        withoutWorkspaceId(request.body),
      ),
    });
  }));
  router.get("/projects/:projectId/versions", asyncRoute(async (request, response) => {
    const workspaceId = requireUuid(request.query.workspaceId, "workspaceId");
    const projectId = requireUuid(request.params.projectId, "projectId");
    response.json({
      items: await service.listVersions(request.verifyIdentity, workspaceId, projectId),
    });
  }));
  router.post("/projects/:projectId/versions", asyncRoute(async (request, response) => {
    const workspaceId = requireUuid(request.body?.workspaceId, "workspaceId");
    const projectId = requireUuid(request.params.projectId, "projectId");
    response.status(201).json({
      item: await service.createVersion(
        request.verifyIdentity,
        workspaceId,
        projectId,
        withoutWorkspaceId(request.body),
      ),
    });
  }));
  router.get("/projects/:projectId/validations", asyncRoute(async (request, response) => {
    const workspaceId = requireUuid(request.query.workspaceId, "workspaceId");
    const projectId = requireUuid(request.params.projectId, "projectId");
    response.json({
      items: await service.listValidations(request.verifyIdentity, workspaceId, projectId),
    });
  }));
  router.post("/projects/:projectId/validations", asyncRoute(async (request, response) => {
    const workspaceId = requireUuid(request.body?.workspaceId, "workspaceId");
    const projectId = requireUuid(request.params.projectId, "projectId");
    response.status(201).json({
      item: await service.createValidation(
        request.verifyIdentity,
        workspaceId,
        projectId,
        withoutWorkspaceId(request.body),
      ),
    });
  }));
  router.get("/projects/:projectId/executions", asyncRoute(async (request, response) => {
    const projectId = requireUuid(request.params.projectId, "projectId");
    response.json({
      items: await service.listVerifyExecutions(request.verifyIdentity, projectId),
    });
  }));
  router.post("/projects/:projectId/executions", asyncRoute(async (request, response) => {
    const projectId = requireUuid(request.params.projectId, "projectId");
    response.status(202).json({
      item: await service.enqueueVerifyExecution(
        request.verifyIdentity,
        projectId,
        request.body,
      ),
    });
  }));
  router.get("/executions/:executionId", asyncRoute(async (request, response) => {
    const executionId = requireUuid(request.params.executionId, "executionId");
    response.json({ item: await service.getVerifyExecution(request.verifyIdentity, executionId) });
  }));
  router.post("/executions/:executionId/cancel", asyncRoute(async (request, response) => {
    const executionId = requireUuid(request.params.executionId, "executionId");
    response.json({
      item: await service.cancelVerifyExecution(request.verifyIdentity, executionId),
    });
  }));
  router.get("/executions/:executionId/evidence", asyncRoute(async (request, response) => {
    const executionId = requireUuid(request.params.executionId, "executionId");
    const evidence = await service.getVerifyExecutionEvidence(request.verifyIdentity, executionId);
    try {
      const file = await fs.readFile(getExecutionEvidencePath(evidence.id));
      if (
        file.length !== evidence.byte_length ||
        crypto.createHash("sha256").update(file).digest("hex") !== evidence.sha256
      ) {
        throw new VerifyError(410, "A evidência não está disponível.", "EVIDENCE_UNAVAILABLE");
      }
      response
        .status(200)
        .type("png")
        .set("Cache-Control", "private, no-store")
        .set("Content-Length", String(file.length))
        .send(file);
    } catch (error) {
      if (error instanceof VerifyError) throw error;
      if (error?.code === "ENOENT") {
        throw new VerifyError(410, "A evidência não está disponível.", "EVIDENCE_UNAVAILABLE");
      }
      throw error;
    }
  }));
  router.get("/projects/:projectId/history", asyncRoute(async (request, response) => {
    const workspaceId = requireUuid(request.query.workspaceId, "workspaceId");
    const projectId = requireUuid(request.params.projectId, "projectId");
    response.json({
      items: await service.listProjectHistory(request.verifyIdentity, workspaceId, projectId),
    });
  }));

  router.use((error, _request, response, next) => {
    if (error instanceof VerifyError) {
      return response.status(error.status).json({ error: error.message, code: error.code });
    }
    if (error?.code === "23505") {
      return response.status(409).json({ error: "Registro já existe.", code: "CONFLICT" });
    }
    next(error);
  });
  return router;
}

function withoutWorkspaceId(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;
  const { workspaceId: _workspaceId, ...payload } = body;
  return payload;
}

function asyncRoute(handler) {
  return (request, response, next) => {
    if (!isVerifyIdentity(request.verifyIdentity)) {
      return response.status(401).json({
        error: "Autenticação de clientes do Verify ainda não está integrada.",
        code: "VERIFY_IDENTITY_REQUIRED",
      });
    }
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}
