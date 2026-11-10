import { getD1 } from "@/db";
import { requireAdminApi } from "@/lib/admin/auth";
import { seedCmsDefaults } from "@/lib/cms/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi("viewer");
  if (!auth.admin) return auth.response;
  if (auth.admin.role === "owner") await seedCmsDefaults(auth.admin.email);
  const d1 = await getD1();
  const [projects, services, team, leads, audit] = await Promise.all([
    d1.prepare("SELECT status, COUNT(*) AS total FROM cms_projects GROUP BY status").all(),
    d1.prepare("SELECT COUNT(*) AS total FROM services WHERE is_active = 1").first(),
    d1.prepare("SELECT COUNT(*) AS total FROM team_members WHERE is_active = 1").first(),
    d1.prepare("SELECT status, COUNT(*) AS total FROM leads GROUP BY status").all(),
    d1.prepare("SELECT actor_email AS actorEmail, action, entity_type AS entityType, entity_id AS entityId, created_at AS createdAt FROM audit_logs ORDER BY id DESC LIMIT 8").all(),
  ]);
  const projectCounts = Object.fromEntries(((projects.results || []) as Array<{ status: string; total: number }>).map((row) => [row.status, Number(row.total)]));
  const leadCounts = Object.fromEntries(((leads.results || []) as Array<{ status: string; total: number }>).map((row) => [row.status, Number(row.total)]));
  return Response.json({
    stats: { published: projectCounts.published || 0, drafts: projectCounts.draft || 0, services: Number(services?.total || 0), team: Number(team?.total || 0), leads: Object.values(leadCounts).reduce((sum, value) => sum + Number(value), 0) },
    leadCounts,
    audit: audit.results || [],
  }, { headers: { "cache-control": "no-store" } });
}
