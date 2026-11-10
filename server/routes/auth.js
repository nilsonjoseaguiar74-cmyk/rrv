import { Router } from "express";
import { query, transaction } from "../db.js";
import { verifyPassword } from "../auth/password.js";
import { clearSessionCookie, createSession, hashToken, readCookie, resolveSession, sessionCookie } from "../auth/session.js";
import { audit } from "../services/audit.js";

export const authRouter = Router();

authRouter.post("/login", async (request, response, next) => {
  try {
    const email = String(request.body?.email || "").trim().toLowerCase();
    const password = String(request.body?.password || "");
    const result = await query("SELECT id, email, name, role, password_hash FROM admin_users WHERE email = $1 AND is_active = true LIMIT 1", [email]);
    const user = result.rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) return response.status(401).json({ error: "E-mail ou senha inválidos." });
    const session = await createSession(user.id);
    await transaction(async (client) => {
      await client.query("UPDATE admin_users SET last_login_at = now(), updated_at = now() WHERE id = $1", [user.id]);
      await audit(client, user, "LOGIN", "admin_user", user.id, { ip: request.ip });
    });
    response.setHeader("Set-Cookie", sessionCookie(session.token, session.expiresAt));
    response.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) { next(error); }
});

authRouter.post("/logout", async (request, response, next) => {
  try {
    const token = readCookie(request);
    const user = await resolveSession(request);
    if (token) await query("DELETE FROM admin_sessions WHERE token_hash = $1", [hashToken(token)]);
    if (user) await transaction((client) => audit(client, user, "LOGOUT", "admin_user", user.id));
    response.setHeader("Set-Cookie", clearSessionCookie());
    response.json({ ok: true });
  } catch (error) { next(error); }
});

authRouter.get("/me", async (request, response, next) => {
  try {
    const user = await resolveSession(request);
    if (!user) return response.status(401).json({ error: "Sessão inválida ou expirada." });
    response.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) { next(error); }
});
