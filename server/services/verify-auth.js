import crypto from "node:crypto";
import { config } from "../config.js";
import { query, transaction } from "../db.js";
import { audit } from "./audit.js";
import { VerifyAuthError } from "./verify-auth-error.js";
import {
  isAllowedVerifyInvitationUrl,
  isVerifyEmailDeliveryAvailable,
  sendVerifyAccessCode,
  sendVerifyInvitation,
} from "./verify-mailer.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const INVITE_ISSUER = "https://rrv.digital/verify/invite";
const WORKSPACE_ROLES = new Set(["owner", "admin", "editor", "viewer"]);
const ACCESS_CODE_PATTERN = /^\d{6}$/;
const ACCESS_CODE_TTL_MS = 5 * 60 * 1000;
const ACCESS_CODE_REQUEST_LIMIT = 5;
const ACCESS_CODE_REQUEST_WINDOW_MS = 15 * 60 * 1000;

export function normalizeVerifyEmail(value) {
  if (typeof value !== "string") {
    throw new VerifyAuthError(400, "Nome ou e-mail inválido.", "INVALID_PROFILE");
  }
  const email = value.trim().toLowerCase();
  if (email.length > 320 || !EMAIL_PATTERN.test(email)) {
    throw new VerifyAuthError(400, "Nome ou e-mail inválido.", "INVALID_PROFILE");
  }
  return email;
}

export function hashVerifyToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function hashAccessCode(invitationId, challengeId, code) {
  if (typeof config.sessionSecret !== "string" || Buffer.byteLength(config.sessionSecret) < 32) {
    throw new VerifyAuthError(
      503,
      "A configuração segura de sessão do Verify está pendente.",
      "VERIFY_SESSION_SECRET_REQUIRED",
    );
  }
  return crypto
    .createHmac("sha256", config.sessionSecret)
    .update(`${invitationId}:${challengeId}:${code}`)
    .digest("hex");
}

function compareHashes(left, right) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function validateInviteInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new VerifyAuthError(400, "Convite inválido.", "INVALID_INVITE");
  }
  const allowed = new Set(["email", "workspaceId", "workspaceName", "role"]);
  if (Object.keys(input).some((key) => !allowed.has(key))) {
    throw new VerifyAuthError(400, "Convite inválido.", "INVALID_INVITE");
  }
  const email = normalizeVerifyEmail(input.email);
  const hasWorkspaceId = typeof input.workspaceId === "string" && input.workspaceId.length > 0;
  const hasWorkspaceName = typeof input.workspaceName === "string" && input.workspaceName.trim().length > 0;
  if (hasWorkspaceId === hasWorkspaceName) {
    throw new VerifyAuthError(400, "Informe um workspace existente ou um nome de workspace.", "INVALID_WORKSPACE");
  }
  if (input.role !== undefined && !WORKSPACE_ROLES.has(input.role)) {
    throw new VerifyAuthError(400, "Papel de acesso inválido.", "INVALID_ROLE");
  }
  let workspaceId = null;
  let workspaceName = null;
  if (hasWorkspaceId) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.workspaceId)) {
      throw new VerifyAuthError(400, "Workspace inválido.", "INVALID_WORKSPACE");
    }
    workspaceId = input.workspaceId;
  } else {
    workspaceName = input.workspaceName.trim();
    if (workspaceName.length > 160) {
      throw new VerifyAuthError(400, "Workspace inválido.", "INVALID_WORKSPACE");
    }
  }
  return {
    email,
    workspaceId,
    workspaceName,
    role: hasWorkspaceName ? "owner" : input.role || "viewer",
  };
}

function validateAccessRequest(input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => key !== "email")
  ) {
    throw new VerifyAuthError(400, "Informe o e-mail cadastrado.", "INVALID_ACCESS_REQUEST");
  }
  return normalizeVerifyEmail(input.email);
}

function validateAccessConfirmation(input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => !["email", "code", "name"].includes(key))
  ) {
    throw new VerifyAuthError(400, "Código inválido ou expirado.", "ACCESS_CODE_INVALID");
  }
  let email;
  try {
    email = normalizeVerifyEmail(input.email);
  } catch {
    throw new VerifyAuthError(400, "Código inválido ou expirado.", "ACCESS_CODE_INVALID");
  }
  const rawName = input.name === undefined ? email : input.name;
  if (
    typeof input.code !== "string" ||
    !ACCESS_CODE_PATTERN.test(input.code) ||
    typeof rawName !== "string" ||
    rawName.trim().length < 1 ||
    rawName.trim().length > 160
  ) {
    throw new VerifyAuthError(400, "Código inválido ou expirado.", "ACCESS_CODE_INVALID");
  }
  return { email, code: input.code, name: rawName.trim() };
}

export async function issueVerifyInvitation(
  input,
  admin,
  {
    emailDeliveryAvailable = isVerifyEmailDeliveryAvailable,
    sendInvitation = sendVerifyInvitation,
  } = {},
) {
  if (!emailDeliveryAvailable()) {
    throw new VerifyAuthError(
      503,
      "O envio de convites do Verify ainda não está configurado.",
      "VERIFY_EMAIL_UNAVAILABLE",
    );
  }
  if (!admin || typeof admin.id !== "string") {
    throw new VerifyAuthError(401, "Sessão administrativa obrigatória.", "ADMIN_REQUIRED");
  }
  const invite = validateInviteInput(input);
  const expiresAt = new Date(Date.now() + config.verifyInviteTtlHours * 3_600_000);
  let invitationUrl;
  try {
    invitationUrl = new URL("/start/verify/access", config.allowedOrigin);
  } catch {
    throw new VerifyAuthError(
      503,
      "Configure uma origem pública HTTPS para enviar convites do Verify.",
      "VERIFY_PUBLIC_URL_REQUIRED",
    );
  }
  if (!isAllowedVerifyInvitationUrl(invitationUrl.toString())) {
    throw new VerifyAuthError(
      503,
      "Configure uma origem pública HTTPS para enviar convites do Verify.",
      "VERIFY_PUBLIC_URL_REQUIRED",
    );
  }
  const created = await transaction(async (client) => {
    let workspaceId = invite.workspaceId;
    if (workspaceId) {
      const workspace = await client.query(
        "SELECT id FROM verify_workspaces WHERE id = $1",
        [workspaceId],
      );
      if (!workspace.rows[0]) {
        throw new VerifyAuthError(404, "Workspace não encontrado.", "WORKSPACE_NOT_FOUND");
      }
    } else {
      const workspace = await client.query(
        "INSERT INTO verify_workspaces (name) VALUES ($1) RETURNING id",
        [invite.workspaceName],
      );
      workspaceId = workspace.rows[0].id;
    }
    const result = await client.query(
      `INSERT INTO verify_invitations
         (workspace_id, email, role, max_attempts, expires_at, issued_by_admin_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        workspaceId,
        invite.email,
        invite.role,
        config.verifyInviteMaxAttempts,
        expiresAt,
        admin.id,
      ],
    );
    await audit(client, admin, "CREATE_VERIFY_INVITE", "verify_invitation", result.rows[0].id, {
      workspaceId,
      role: invite.role,
    });
    return {
      id: result.rows[0].id,
      workspaceId,
      workspaceCreated: Boolean(invite.workspaceName),
    };
  });

  try {
    await sendInvitation({
      to: invite.email,
      workspaceName: invite.workspaceName || undefined,
      invitationUrl: invitationUrl.toString(),
      expiresAt,
    });
  } catch {
    await transaction(async (client) => {
      await client.query(
        "UPDATE verify_invitations SET revoked_at = now() WHERE id = $1 AND consumed_at IS NULL",
        [created.id],
      );
      if (created.workspaceCreated) {
        await client.query("DELETE FROM verify_workspaces WHERE id = $1", [created.workspaceId]);
      }
    });
    throw new VerifyAuthError(
      503,
      "O convite não pôde ser entregue; nenhuma credencial foi emitida.",
      "VERIFY_EMAIL_UNAVAILABLE",
    );
  }
  return { id: created.id, expiresAt };
}

export async function requestVerifyAccessCode(
  input,
  {
    emailDeliveryAvailable = isVerifyEmailDeliveryAvailable,
    sendCode = sendVerifyAccessCode,
  } = {},
) {
  const email = validateAccessRequest(input);
  if (!emailDeliveryAvailable()) {
    throw new VerifyAuthError(
      503,
      "O envio de códigos do Verify ainda não está configurado.",
      "VERIFY_EMAIL_UNAVAILABLE",
    );
  }
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  const challenge = await transaction(async (client) => {
    const result = await client.query(
      `SELECT id, email, max_attempts, code_request_count, code_request_window_started_at
       FROM verify_invitations
       WHERE lower(email) = $1 AND expires_at > now()
         AND consumed_at IS NULL AND revoked_at IS NULL
       ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
      [email],
    );
    const invitation = result.rows[0];
    if (!invitation) return null;

    const windowStartedAt = invitation.code_request_window_started_at
      ? new Date(invitation.code_request_window_started_at).getTime()
      : 0;
    const isWindowActive = Date.now() - windowStartedAt < ACCESS_CODE_REQUEST_WINDOW_MS;
    const requestCount = isWindowActive ? Number(invitation.code_request_count) : 0;
    if (requestCount >= ACCESS_CODE_REQUEST_LIMIT) return null;

    const challengeId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ACCESS_CODE_TTL_MS);
    const codeHash = hashAccessCode(invitation.id, challengeId, code);
    await client.query(
      `UPDATE verify_access_codes
       SET revoked_at = now()
       WHERE invitation_id = $1 AND consumed_at IS NULL AND revoked_at IS NULL`,
      [invitation.id],
    );
    await client.query(
      `INSERT INTO verify_access_codes
         (id, invitation_id, code_hash, max_attempts, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [challengeId, invitation.id, codeHash, invitation.max_attempts, expiresAt],
    );
    await client.query(
      `UPDATE verify_invitations
       SET code_request_count = $2, code_request_window_started_at = $3
       WHERE id = $1`,
      [
        invitation.id,
        requestCount + 1,
        isWindowActive ? invitation.code_request_window_started_at : new Date(),
      ],
    );
    return { invitationId: invitation.id, email: invitation.email, challengeId, code, expiresAt };
  });

  if (challenge) {
    try {
      await sendCode({
        to: challenge.email,
        code: challenge.code,
        expiresAt: challenge.expiresAt,
      });
    } catch {
      await query(
        "UPDATE verify_access_codes SET revoked_at = now() WHERE id = $1 AND consumed_at IS NULL",
        [challenge.challengeId],
      );
      throw new VerifyAuthError(
        503,
        "O código não pôde ser entregue; solicite acesso novamente mais tarde.",
        "VERIFY_EMAIL_UNAVAILABLE",
      );
    }
  }
  return {
    message: "Se o e-mail estiver cadastrado e houver convite válido, você receberá um código temporário.",
  };
}

export async function verifyVerifyAccessCode(input) {
  const { email, code, name } = validateAccessConfirmation(input);
  const result = await transaction(async (client) => {
    const challengeResult = await client.query(
      `SELECT access_code.id AS challenge_id, access_code.code_hash,
              access_code.attempts, access_code.max_attempts,
              access_code.expires_at AS code_expires_at,
              access_code.consumed_at AS code_consumed_at,
              access_code.revoked_at AS code_revoked_at,
              invitation.id AS invitation_id, invitation.workspace_id,
              invitation.email, invitation.role, invitation.expires_at,
              invitation.consumed_at, invitation.revoked_at
       FROM verify_access_codes AS access_code
       JOIN verify_invitations AS invitation ON invitation.id = access_code.invitation_id
       WHERE lower(invitation.email) = $1
         AND access_code.consumed_at IS NULL AND access_code.revoked_at IS NULL
       ORDER BY access_code.created_at DESC
       LIMIT 1 FOR UPDATE OF access_code, invitation`,
      [email],
    );
    const challenge = challengeResult.rows[0];
    if (
      !challenge ||
      challenge.consumed_at ||
      challenge.revoked_at ||
      challenge.code_consumed_at ||
      challenge.code_revoked_at ||
      new Date(challenge.expires_at).getTime() <= Date.now() ||
      new Date(challenge.code_expires_at).getTime() <= Date.now() ||
      challenge.attempts >= challenge.max_attempts
    ) {
      return null;
    }

    const expectedHash = hashAccessCode(challenge.invitation_id, challenge.challenge_id, code);
    if (!compareHashes(challenge.code_hash, expectedHash)) {
      await client.query(
        `UPDATE verify_access_codes
         SET attempts = attempts + 1,
             revoked_at = CASE WHEN attempts + 1 >= max_attempts THEN now() ELSE revoked_at END
         WHERE id = $1`,
        [challenge.challenge_id],
      );
      return null;
    }

    const identityResult = await client.query(
      `INSERT INTO verify_identities (issuer, subject, email, display_name, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (issuer, subject) DO UPDATE
         SET email = excluded.email, display_name = excluded.display_name,
             is_active = true, updated_at = now()
       RETURNING id, email, display_name AS name`,
      [INVITE_ISSUER, email, email, name],
    );
    const identity = identityResult.rows[0];
    await client.query(
      `INSERT INTO verify_workspace_members (workspace_id, identity_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (workspace_id, identity_id) DO UPDATE SET role = excluded.role`,
      [challenge.workspace_id, identity.id, challenge.role],
    );
    await client.query(
      "UPDATE verify_access_codes SET consumed_at = now() WHERE id = $1",
      [challenge.challenge_id],
    );
    await client.query(
      "UPDATE verify_invitations SET consumed_at = now() WHERE id = $1",
      [challenge.invitation_id],
    );

    const sessionToken = crypto.randomBytes(32).toString("base64url");
    const sessionExpiresAt = new Date(Date.now() + config.verifySessionTtlHours * 3_600_000);
    await client.query(
      `INSERT INTO verify_sessions (identity_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [identity.id, hashVerifyToken(sessionToken), sessionExpiresAt],
    );
    await client.query(
      `INSERT INTO verify_change_history
         (workspace_id, actor_identity_id, action, details)
       VALUES ($1, $2, 'identity.joined', $3::jsonb)`,
      [challenge.workspace_id, identity.id, JSON.stringify({ invitationId: challenge.invitation_id })],
    );
    return {
      identity: { ...identity, active: true },
      workspaceId: challenge.workspace_id,
      token: sessionToken,
      expiresAt: sessionExpiresAt,
    };
  });
  if (!result) {
    throw new VerifyAuthError(400, "Código inválido ou expirado.", "ACCESS_CODE_INVALID");
  }
  return result;
}

export function readVerifySessionCookie(request) {
  const cookieHeader = request.headers.cookie || "";
  for (const part of cookieHeader.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === VERIFY_SESSION_COOKIE) {
      try {
        return decodeURIComponent(value.join("="));
      } catch {
        return "";
      }
    }
  }
  return "";
}

export const VERIFY_SESSION_COOKIE = "rrv_verify_session";

export function verifySessionCookie(token, expiresAt) {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  return `${VERIFY_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/api/verify; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${config.production ? "; Secure" : ""}`;
}

export function clearVerifySessionCookie() {
  return `${VERIFY_SESSION_COOKIE}=; Path=/api/verify; HttpOnly; SameSite=Strict; Max-Age=0${config.production ? "; Secure" : ""}`;
}

export async function resolveVerifySession(request) {
  const token = readVerifySessionCookie(request);
  if (!token || !TOKEN_PATTERN.test(token)) return null;
  const result = await query(
    `SELECT identity.id, identity.email, identity.display_name AS name,
            session.id AS session_id
     FROM verify_sessions AS session
     JOIN verify_identities AS identity
       ON identity.id = session.identity_id AND identity.is_active = true
     WHERE session.token_hash = $1 AND session.expires_at > now()
       AND session.revoked_at IS NULL
     LIMIT 1`,
    [hashVerifyToken(token)],
  );
  const identity = result.rows[0];
  if (!identity) return null;
  await query("UPDATE verify_sessions SET last_used_at = now() WHERE id = $1", [
    identity.session_id,
  ]);
  const memberships = await query(
    `SELECT member.workspace_id AS "workspaceId", workspace.name AS "workspaceName",
            member.role
     FROM verify_workspace_members AS member
     JOIN verify_workspaces AS workspace ON workspace.id = member.workspace_id
     WHERE member.identity_id = $1 ORDER BY workspace.name`,
    [identity.id],
  );
  return {
    identity: { id: identity.id, email: identity.email, name: identity.name, active: true },
    workspaces: memberships.rows,
  };
}

export async function revokeVerifySession(request) {
  const token = readVerifySessionCookie(request);
  if (!token || !TOKEN_PATTERN.test(token)) return;
  await query(
    "UPDATE verify_sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL",
    [hashVerifyToken(token)],
  );
}
