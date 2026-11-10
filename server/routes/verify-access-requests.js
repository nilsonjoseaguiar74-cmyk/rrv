import { Router } from "express";
import { VerifyAuthError } from "../services/verify-auth-error.js";
import { createVerifyAccessRequest } from "../services/verify-access-requests.js";

export function createVerifyAccessRequestsRouter(createRequest = createVerifyAccessRequest) {
  const router = Router();
  router.post("/", async (request, response, next) => {
    try {
      const result = await createRequest(request.body);
      response.status(202).json(result);
    } catch (error) {
      if (error instanceof VerifyAuthError) {
        return response.status(error.status).json({ error: error.message, code: error.code });
      }
      next(error);
    }
  });
  return router;
}

export const verifyAccessRequestsRouter = createVerifyAccessRequestsRouter();
