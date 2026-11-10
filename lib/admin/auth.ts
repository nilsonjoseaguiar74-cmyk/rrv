import { getChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import { getD1 } from "@/db";

export type AdminRole = "owner" | "admin" | "editor" | "viewer";
export type AdminIdentity = ChatGPTUser & { role: AdminRole };

const roleRank: Record<AdminRole, number> = { viewer: 0, editor: 1, admin: 2, owner: 3 };

async function configuredOwnerEmails() {
  try {
    const { env } = await import("cloudflare:workers");
    const raw = String((env as Record<string, unknown>).ADMIN_OWNER_EMAILS || "");
    return raw.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  } catch {
    return [];
  }
}

export async function resolveAdmin(user: ChatGPTUser): Promise<AdminIdentity | null> {
  const email = user.email.trim().toLowerCase();
  const owners = await configuredOwnerEmails();
  if (owners.includes(email)) {
    try {
      const d1 = await getD1();
      await d1.prepare(`INSERT INTO admin_users (email, name, role, is_active)
        VALUES (?, ?, 'owner', 1)
        ON CONFLICT(email) DO UPDATE SET name = excluded.name, role = 'owner', is_active = 1, updated_at = CURRENT_TIMESTAMP`)
        .bind(email, user.fullName || user.displayName || "").run();
    } catch (cause) {
      console.warn("admin_owner_sync_deferred", cause);
    }
    return { ...user, email, role: "owner" };
  }

  try {
    const d1 = await getD1();
    const record = await d1.prepare("SELECT role FROM admin_users WHERE lower(email) = ? AND is_active = 1 LIMIT 1").bind(email).first() as { role: AdminRole } | null;
    if (!record || !(record.role in roleRank)) return null;
    return { ...user, email, role: record.role };
  } catch {
    return null;
  }
}

export async function getAdmin(): Promise<AdminIdentity | null> {
  const user = await getChatGPTUser();
  return user ? resolveAdmin(user) : null;
}

export async function requireAdminApi(minimumRole: AdminRole = "viewer") {
  const admin = await getAdmin();
  if (!admin) return { admin: null, response: Response.json({ error: "Acesso administrativo não autorizado." }, { status: 403 }) };
  if (roleRank[admin.role] < roleRank[minimumRole]) {
    return { admin: null, response: Response.json({ error: "Seu perfil não possui permissão para esta ação." }, { status: 403 }) };
  }
  return { admin, response: null };
}

export function canWrite(role: AdminRole) {
  return roleRank[role] >= roleRank.editor;
}
