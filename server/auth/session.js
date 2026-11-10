import crypto from "node:crypto";
import { config } from "../config.js";
import { query } from "../db.js";

export const SESSION_COOKIE = "rrv_admin_session";
export const roles = Object.freeze({ viewer: 0, editor: 1, admin: 2, owner: 3 });

export function hashToken(token) {
  return crypto.createHmac("sha256", config.sessionSecret || "rrv-development-only").update(token).digest("hex");
}

export function readCookie(request, name = SESSION_COOKIE) {
  const raw = request.headers.cookie || "";
  for (const part of raw.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return "";
}

export function sessionCookie(token, expiresAt) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))}${config.production ? "; Secure" : ""}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${config.production ? "; Secure" : ""}`;
}

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + config.sessionTtlHours * 3_600_000);
  await query("INSERT INTO admin_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)", [userId, hashToken(token), expiresAt]);
  return { token, expiresAt };
}

export async function resolveSession(request) {
  const token = readCookie(request);
  if (!token) return null;
  const result = await query(`SELECT u.id, u.email, u.name, u.role, s.id AS session_id
    FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
    WHERE s.token_hash = $1 AND s.expires_at > now() AND u.is_active = true LIMIT 1`, [hashToken(token)]);
  const user = result.rows[0] || null;
  if (user) await query("UPDATE admin_sessions SET last_used_at = now() WHERE id = $1", [user.session_id]);
  return user;
}
