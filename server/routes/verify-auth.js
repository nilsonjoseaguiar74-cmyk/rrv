import { Router } from "express";
import {
  clearVerifySessionCookie,
  requestVerifyAccessCode,
  revokeVerifySession,
  resolveVerifySession,
  verifySessionCookie,
  verifyVerifyAccessCode,
} from "../services/verify-auth.js";
import { VerifyAuthError } from "../services/verify-auth-error.js";

export const verifyAuthRouter = createVerifyAuthRouter();

export function createVerifyAuthRouter(service = {
  requestVerifyAccessCode,
  revokeVerifySession,
  resolveVerifySession,
  verifyVerifyAccessCode,
}) {
  const router = Router();

  router.post("/request-code", asyncRoute(async (request, response) => {
    const result = await service.requestVerifyAccessCode(request.body);
    response.status(202).json(result);
  }));

  router.post("/verify-code", asyncRoute(async (request, response) => {
    const result = await service.verifyVerifyAccessCode(request.body);
    response.setHeader("Set-Cookie", verifySessionCookie(result.token, result.expiresAt));
    response.status(200).json({
      identity: result.identity,
      workspaceId: result.workspaceId,
      expiresAt: result.expiresAt,
    });
  }));

  router.get("/session", asyncRoute(async (request, response) => {
    const session = await service.resolveVerifySession(request);
    if (!session) {
      return response.status(401).json({ error: "Sessão do Verify inválida ou expirada." });
    }
    response.json(session);
  }));

  router.post("/logout", asyncRoute(async (request, response) => {
    await service.revokeVerifySession(request);
    response.setHeader("Set-Cookie", clearVerifySessionCookie());
    response.json({ ok: true });
  }));

  router.use((error, _request, response, next) => {
    if (error instanceof VerifyAuthError) {
      return response.status(error.status).json({ error: error.message, code: error.code });
    }
    next(error);
  });
  return router;
}

function asyncRoute(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}
