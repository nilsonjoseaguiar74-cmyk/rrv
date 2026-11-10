import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import { issueVerifyInvitation } from "../services/verify-auth.js";
import { VerifyAuthError } from "../services/verify-auth-error.js";

export const verifyAdminRouter = createVerifyAdminRouter();

export function createVerifyAdminRouter(issueInvitation = issueVerifyInvitation) {
  const router = Router();
  router.use(requireRole("admin"));
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
