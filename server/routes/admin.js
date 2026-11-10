import { Router } from "express";
import { query, transaction } from "../db.js";
import { requireRole } from "../middleware/auth.js";
import { audit } from "../services/audit.js";

export const adminRouter = Router();
const statuses = ["draft", "published", "archived"];
const leadStatuses = ["new", "contacted", "qualified", "proposal", "won", "lost", "spam"];
const slugify = (value) => String(value || "item").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 100) || `item-${Date.now()}`;
const bool = (value) => value === true || value === 1 || value === "true" || value === "1";

const resources = {
  services: {
    table: "services", select: `id, slug, title AS name, description, category, icon, cta, sort_order AS "sortOrder", is_active AS "isActive", status, updated_at AS "updatedAt"`,
    writable: { slug: "slug", name: "title", description: "description", category: "category", icon: "icon", cta: "cta", sortOrder: "sort_order", isActive: "is_active", status: "status" }, required: ["name", "category"],
  },
  projects: {
    table: "projects", select: `id, slug, title, description, image_url AS "imageUrl", external_url AS "projectUrl", category, technologies, featured, sort_order AS "sortOrder", status, updated_at AS "updatedAt"`,
    writable: { slug: "slug", title: "title", description: "description", imageUrl: "image_url", projectUrl: "external_url", category: "category", technologies: "technologies", featured: "featured", sortOrder: "sort_order", status: "status" }, required: ["title", "category"],
  },
  team: {
    table: "team_members", select: `id, slug, name, role, bio AS biography, image_url AS "imageUrl", linkedin_url AS "linkedinUrl", discipline, sort_order AS "sortOrder", is_active AS "isActive", status, updated_at AS "updatedAt"`,
    writable: { slug: "slug", name: "name", role: "role", biography: "bio", imageUrl: "image_url", linkedinUrl: "linkedin_url", discipline: "discipline", sortOrder: "sort_order", isActive: "is_active", status: "status" }, required: ["name", "role"],
  },
  ctas: {
    table: "cta_blocks", select: `id, slug, title, label, url, context, sort_order AS "sortOrder", is_active AS "isActive", status, updated_at AS "updatedAt"`,
    writable: { slug: "slug", title: "title", label: "label", url: "url", context: "context", sortOrder: "sort_order", isActive: "is_active", status: "status" }, required: ["title", "label", "url"],
  },
};

function normalized(key, value) {
  if (["isActive", "featured"].includes(key)) return bool(value);
  if (key === "sortOrder") return Math.max(0, Number(value) || 0);
  if (key === "status") return statuses.includes(String(value)) ? String(value) : "draft";
  if (key === "slug") return slugify(value);
  return String(value ?? "").trim().slice(0, 5000);
}

adminRouter.get("/dashboard", requireRole("viewer"), async (_request, response, next) => {
  try {
    const result = await query(`SELECT
      (SELECT count(*)::int FROM leads WHERE status='new') AS "newLeads",
      (SELECT count(*)::int FROM leads WHERE created_at >= date_trunc('month', now())) AS "monthLeads",
      (SELECT count(*)::int FROM projects WHERE status='published') AS published,
      (SELECT count(*)::int FROM projects WHERE status='draft') AS drafts,
      (SELECT count(*)::int FROM services WHERE is_active=true AND status='published') AS services,
      (SELECT count(*)::int FROM team_members WHERE is_active=true AND status='published') AS team,
      (SELECT count(*)::int FROM leads) AS leads`);
    const auditResult = await query(`SELECT a.action, a.entity_type AS "entityType", a.entity_id AS "entityId", a.created_at AS "createdAt", coalesce(u.email,'system') AS "actorEmail"
      FROM audit_logs a LEFT JOIN admin_users u ON u.id=a.admin_user_id ORDER BY a.created_at DESC LIMIT 20`);
    response.json({ stats: result.rows[0], audit: auditResult.rows });
  } catch (error) { next(error); }
});

adminRouter.get(["/home", "/settings"], requireRole("viewer"), async (_request, response, next) => {
  try {
    const [settings, sections] = await Promise.all([query(`SELECT key, coalesce(draft_value,value) AS value, status, updated_at AS "updatedAt" FROM site_settings ORDER BY key`), query(`SELECT id, slug, title, content, is_active AS "isActive", sort_order AS "sortOrder", status, updated_at AS "updatedAt" FROM home_sections ORDER BY sort_order, created_at`)]);
    response.json({ settings: settings.rows, sections: sections.rows });
  } catch (error) { next(error); }
});

adminRouter.put(["/home", "/settings"], requireRole("editor"), updateSettings);
adminRouter.post(["/home", "/settings"], requireRole("editor"), updateSettings);

async function updateSettings(request, response, next) {
  try {
    const values = request.body?.values && typeof request.body.values === "object" ? request.body.values : {};
    const publish = request.body?.publish !== false;
    await transaction(async (client) => {
      for (const [key, value] of Object.entries(values).slice(0, 80)) {
        await client.query(`INSERT INTO site_settings (key, value, draft_value, status, updated_by)
          VALUES ($1,$2,$2,$3,$4) ON CONFLICT(key) DO UPDATE SET
          value = CASE WHEN $3='published' THEN excluded.value ELSE site_settings.value END,
          draft_value=excluded.draft_value,status=$3,updated_by=$4,updated_at=now()`, [String(key).slice(0,100), String(value).slice(0,5000), publish ? "published" : "draft", request.admin.id]);
      }
      if (Array.isArray(request.body?.sections)) for (const item of request.body.sections.slice(0,50)) {
        await client.query("UPDATE home_sections SET is_active=$1, sort_order=$2, updated_at=now(), updated_by=$3 WHERE id=$4", [bool(item.isActive), Math.max(0, Number(item.sortOrder)||0), request.admin.id, item.id]);
      }
      await audit(client, request.admin, publish ? "PUBLISH_HOME" : "UPDATE_HOME", request.path.includes("settings") ? "settings" : "home", null, { keys: Object.keys(values) });
    });
    response.json({ ok: true });
  } catch (error) { next(error); }
}

adminRouter.get("/leads", requireRole("viewer"), async (request, response, next) => {
  try {
    const params = [];
    const conditions = [];
    if (leadStatuses.includes(String(request.query.status))) { params.push(request.query.status); conditions.push(`status=$${params.length}`); }
    if (request.query.search) { params.push(`%${String(request.query.search).slice(0,100)}%`); conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length} OR whatsapp ILIKE $${params.length} OR company ILIKE $${params.length})`); }
    const result = await query(`SELECT id,name,whatsapp,email,company,project_type AS "projectType",description,problem,budget,ref,utm_source AS "utmSource",utm_medium AS "utmMedium",utm_campaign AS "utmCampaign",utm_content AS "utmContent",utm_term AS "utmTerm",status,notes,created_at AS "createdAt",updated_at AS "updatedAt" FROM leads ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""} ORDER BY created_at DESC LIMIT 500`, params);
    response.json({ items: result.rows });
  } catch (error) { next(error); }
});

adminRouter.get("/leads/:id", requireRole("viewer"), async (request, response, next) => {
  try { const result = await query("SELECT * FROM leads WHERE id=$1", [request.params.id]); if (!result.rows[0]) return response.status(404).json({ error: "Lead não encontrado." }); response.json({ item: result.rows[0] }); } catch (error) { next(error); }
});

adminRouter.patch("/leads/:id/status", requireRole("admin"), updateLead);
adminRouter.patch("/leads", requireRole("admin"), updateLead);
async function updateLead(request, response, next) {
  try {
    const id = request.params.id || request.body?.id; const status = String(request.body?.status || "");
    if (!id || !leadStatuses.includes(status)) return response.status(400).json({ error: "Status inválido." });
    await transaction(async (client) => { await client.query("UPDATE leads SET status=$1, notes=coalesce($2,notes), updated_at=now() WHERE id=$3", [status, request.body?.notes || null, id]); await audit(client, request.admin, "UPDATE_LEAD_STATUS", "lead", id, { status }); });
    response.json({ ok: true });
  } catch (error) { next(error); }
}

for (const [resource, cfg] of Object.entries(resources)) {
  adminRouter.get(`/${resource}`, requireRole("viewer"), async (_request, response, next) => { try { const result = await query(`SELECT ${cfg.select} FROM ${cfg.table} ORDER BY sort_order, created_at`); response.json({ items: result.rows }); } catch (error) { next(error); } });
  adminRouter.post(`/${resource}`, requireRole("editor"), (request, response, next) => saveResource(resource, cfg, request, response, next));
  adminRouter.put(`/${resource}/:id`, requireRole("editor"), (request, response, next) => saveResource(resource, cfg, request, response, next));
  adminRouter.delete(`/${resource}/:id`, requireRole("admin"), (request, response, next) => archiveResource(resource, cfg, request, response, next));
  adminRouter.delete(`/${resource}`, requireRole("admin"), (request, response, next) => archiveResource(resource, cfg, request, response, next));
}

async function saveResource(resource, cfg, request, response, next) {
  try {
    for (const field of cfg.required) if (!String(request.body?.[field] || "").trim()) return response.status(400).json({ error: `Campo obrigatório: ${field}` });
    const id = request.params.id || request.body?.id || null;
    const entries = Object.entries(cfg.writable).map(([key, column]) => [column, normalized(key, key === "slug" ? request.body?.slug || request.body?.title || request.body?.name : request.body?.[key])]);
    await transaction(async (client) => {
      if (id) {
        const values = entries.map(([,value])=>value); values.push(request.admin.id, id);
        await client.query(`UPDATE ${cfg.table} SET ${entries.map(([column],i)=>`${column}=$${i+1}`).join(",")},updated_by=$${entries.length+1},updated_at=now() WHERE id=$${entries.length+2}`, values);
      } else {
        const values = entries.map(([,value])=>value); values.push(request.admin.id);
        const result = await client.query(`INSERT INTO ${cfg.table} (${entries.map(([column])=>column).join(",")},updated_by) VALUES (${values.map((_,i)=>`$${i+1}`).join(",")}) RETURNING id`, values);
        request.createdId = result.rows[0].id;
      }
      await audit(client, request.admin, id ? `UPDATE_${resource.toUpperCase()}` : `CREATE_${resource.toUpperCase()}`, resource, id || request.createdId, { status: request.body?.status || "draft" });
    });
    response.status(id ? 200 : 201).json({ ok: true, id: id || request.createdId });
  } catch (error) { next(error); }
}

async function archiveResource(resource, cfg, request, response, next) {
  try {
    const id = request.params.id || request.query.id;
    if (!id) return response.status(400).json({ error: "Registro inválido." });
    await transaction(async (client) => { await client.query(`UPDATE ${cfg.table} SET status='archived',updated_by=$1,updated_at=now() WHERE id=$2`, [request.admin.id,id]); await audit(client, request.admin, `DELETE_${resource.toUpperCase()}`, resource, id); });
    response.json({ ok: true });
  } catch (error) { next(error); }
}
