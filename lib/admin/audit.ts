import { getD1 } from "@/db";

export async function writeAudit(actorEmail: string, action: string, entityType: string, entityId = "", details = "") {
  try {
    const d1 = await getD1();
    await d1.prepare("INSERT INTO audit_logs (actor_email, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)")
      .bind(actorEmail, action, entityType, entityId, details.slice(0, 2000)).run();
  } catch (cause) {
    console.error("audit_log_write_failed", cause);
  }
}
