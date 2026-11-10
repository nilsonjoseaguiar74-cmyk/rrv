import { Router } from "express";
import { isVerifyIdentity, requireVerifyIdentity } from "../middleware/verify-identity.js";
import {
  VerifyError,
  createProject,
  createRequirement,
  createVersion,
  getProject,
  listProjects,
  listRequirements,
  listVersions,
  requireUuid,
  updateProject,
} from "../services/verify.js";

export const verifyRouter = createVerifyRouter();

export function createVerifyRouter(service = {
  createProject,
  createRequirement,
  createVersion,
  getProject,
  listProjects,
  listRequirements,
  listVersions,
  updateProject,
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
