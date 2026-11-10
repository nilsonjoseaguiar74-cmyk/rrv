import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import { issueVerifyInvitation } from "../services/verify-auth.js";
import { VerifyAuthError } from "../services/verify-auth-error.js";
import {
  listVerifyAccessRequests,
  reviewVerifyAccessRequest,
} from "../services/verify-access-requests.js";

export const verifyAdminRouter = createVerifyAdminRouter();

export function createVerifyAdminRouter({
  issueInvitation = issueVerifyInvitation,
  listAccessRequests = listVerifyAccessRequests,
  reviewAccessRequest = reviewVerifyAccessRequest,
  authorizeAdmin = requireRole("admin"),
} = {}) {
  const router = Router();
  router.use(authorizeAdmin);
  router.get("/access-requests", async (request, response, next) => {
    try {
      const items = await listAccessRequests(request.query.status);
      response.json({ items });
    } catch (error) {
      if (error instanceof VerifyAuthError) {
        return response.status(error.status).json({ error: error.message, code: error.code });
      }
      next(error);
    }
  });
  router.patch("/access-requests/:requestId", async (request, response, next) => {
    try {
      const result = await reviewAccessRequest(
        request.params.requestId,
        request.body?.decision,
        request.admin,
        { sendInvitation: issueInvitation },
      );
      response.json({ item: result });
    } catch (error) {
      if (error instanceof VerifyAuthError) {
        return response.status(error.status).json({ error: error.message, code: error.code });
      }
      next(error);
    }
  });
  router.post("/invites", async (request, response, next) => {
    try {
      const invitation = await issueInvitation(request.body, request.admin);
      response.status(202).json({ invitation });
    } catch (error) {
      if (error instanceof VerifyAuthError) {
        return response.status(error.status).json({ error: error.message, code: error.code });
      }
      next(error);
    }
  });
  return router;
}
