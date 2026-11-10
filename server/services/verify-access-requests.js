import { query, transaction } from "../db.js";
import { audit } from "./audit.js";
import { VerifyAuthError } from "./verify-auth-error.js";
import { normalizeVerifyEmail, issueVerifyInvitation } from "./verify-auth.js";

const ACCESS_REQUEST_STATUSES = new Set(["pending", "approving", "approved", "rejected"]);
const REQUEST_ACCEPTED_MESSAGE =
  "Solicitação recebida. A equipe RRV analisará seu interesse; o acesso ao Beta depende de aprovação.";

function requiredText(value, { min = 1, max }) {
  if (typeof value !== "string") {
    throw new VerifyAuthError(400, "Revise os campos da solicitação.", "INVALID_ACCESS_REQUEST");
  }
  const text = value.trim();
  if (text.length < min || text.length > max) {
    throw new VerifyAuthError(400, "Revise os campos da solicitação.", "INVALID_ACCESS_REQUEST");
  }
  return text;
}

export function validateVerifyAccessRequest(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new VerifyAuthError(400, "Solicitação inválida.", "INVALID_ACCESS_REQUEST");
  }
  const allowed = new Set(["name", "email", "companyOrProject", "interest", "website"]);
  if (Object.keys(input).some((key) => !allowed.has(key))) {
    throw new VerifyAuthError(400, "Solicitação inválida.", "INVALID_ACCESS_REQUEST");
  }
  if (input.website !== undefined && typeof input.website !== "string") {
    throw new VerifyAuthError(400, "Solicitação inválida.", "INVALID_ACCESS_REQUEST");
  }
  if (typeof input.website === "string" && input.website.trim()) return null;

  let email;
  try {
    email = normalizeVerifyEmail(input.email);
  } catch {
    throw new VerifyAuthError(400, "Informe um e-mail válido.", "INVALID_ACCESS_REQUEST");
  }
  return {
    name: requiredText(input.name, { min: 2, max: 160 }),
    email,
    companyOrProject: requiredText(input.companyOrProject, {
      min: 2,
      max: 160,
    }),
    interest: requiredText(input.interest, { min: 20, max: 1200 }),
  };
}

export async function createVerifyAccessRequest(input) {
  const request = validateVerifyAccessRequest(input);
  if (!request) return { message: REQUEST_ACCEPTED_MESSAGE };
  await query(
    `INSERT INTO verify_access_requests
       (name, email, company_or_project, interest, status)
     VALUES ($1, $2, $3, $4, 'pending')`,
    [request.name, request.email, request.companyOrProject, request.interest],
  );
  return { message: REQUEST_ACCEPTED_MESSAGE };
}

export async function listVerifyAccessRequests(status) {
  if (status !== undefined && !ACCESS_REQUEST_STATUSES.has(status)) {
    throw new VerifyAuthError(400, "Status de solicitação inválido.", "INVALID_ACCESS_REQUEST_STATUS");
  }
  const result = await query(
    `SELECT id, name, email, company_or_project AS "companyOrProject",
            interest, status, invitation_id AS "invitationId",
            reviewed_at AS "reviewedAt", created_at AS "createdAt",
            updated_at AS "updatedAt"
     FROM verify_access_requests
     WHERE ($1::text IS NULL OR status = $1)
     ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approving' THEN 1 ELSE 2 END,
              created_at ASC
     LIMIT 250`,
    [status || null],
  );
  return result.rows;
}

export async function reviewVerifyAccessRequest(
  requestId,
  decision,
  admin,
  { sendInvitation = issueVerifyInvitation } = {},
) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    throw new VerifyAuthError(400, "Solicitação inválida.", "INVALID_ACCESS_REQUEST");
  }
  if (!["approved", "rejected"].includes(decision)) {
    throw new VerifyAuthError(400, "Decisão inválida.", "INVALID_ACCESS_REQUEST_DECISION");
  }
  if (!admin || typeof admin.id !== "string") {
    throw new VerifyAuthError(401, "Sessão administrativa obrigatória.", "ADMIN_REQUIRED");
  }

  if (decision === "rejected") {
    const rejected = await transaction(async (client) => {
      const result = await client.query(
        `UPDATE verify_access_requests
         SET status = 'rejected', reviewed_by_admin_id = $2,
             reviewed_at = now(), updated_at = now()
         WHERE id = $1 AND status = 'pending'
         RETURNING id`,
        [requestId, admin.id],
      );
      if (!result.rows[0]) return false;
      await audit(client, admin, "REJECT_VERIFY_ACCESS_REQUEST", "verify_access_request", requestId, {});
      return true;
    });
    if (!rejected) {
      const existing = await query("SELECT id FROM verify_access_requests WHERE id = $1", [requestId]);
      if (!existing.rows[0]) {
        throw new VerifyAuthError(404, "Solicitação não encontrada.", "ACCESS_REQUEST_NOT_FOUND");
      }
      throw new VerifyAuthError(409, "Esta solicitação já foi analisada.", "ACCESS_REQUEST_ALREADY_REVIEWED");
    }
    return { id: requestId, status: "rejected" };
  }

  const claim = await query(
    `UPDATE verify_access_requests
     SET status = 'approving',
         reviewed_by_admin_id = $2,
         reviewed_at = NULL,
         updated_at = now()
     WHERE id = $1 AND status = 'pending'
     RETURNING id, name, email, company_or_project AS "companyOrProject",
               status`,
    [requestId, admin.id],
  );
  const request = claim.rows[0];
  if (!request) {
    const existing = await query("SELECT id FROM verify_access_requests WHERE id = $1", [requestId]);
    if (!existing.rows[0]) {
      throw new VerifyAuthError(404, "Solicitação não encontrada.", "ACCESS_REQUEST_NOT_FOUND");
    }
    throw new VerifyAuthError(409, "Esta solicitação já foi analisada.", "ACCESS_REQUEST_ALREADY_REVIEWED");
  }

  let invitation;
  try {
    invitation = await sendInvitation(
      { email: request.email, workspaceName: request.companyOrProject, role: "owner" },
      admin,
    );
  } catch (error) {
    await query(
      `UPDATE verify_access_requests
       SET status = 'pending', reviewed_by_admin_id = NULL, reviewed_at = NULL, updated_at = now()
       WHERE id = $1 AND status = 'approving'`,
      [requestId],
    );
    throw error;
  }

  await transaction(async (client) => {
    await client.query(
      `UPDATE verify_access_requests
       SET status = 'approved', invitation_id = $2, reviewed_by_admin_id = $3,
           reviewed_at = now(), updated_at = now()
       WHERE id = $1 AND status = 'approving'`,
      [requestId, invitation.id, admin.id],
    );
    await audit(
      client,
      admin,
      "APPROVE_VERIFY_ACCESS_REQUEST",
      "verify_access_request",
      requestId,
      { invitationId: invitation.id },
    );
  });
  return { id: requestId, status: "approved", invitationId: invitation.id };
}
