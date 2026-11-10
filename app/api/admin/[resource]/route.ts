import { getD1 } from "@/db";
import { writeAudit } from "@/lib/admin/audit";
import { requireAdminApi } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

type Resource = "home" | "settings" | "services" | "projects" | "team" | "ctas" | "leads";

const collections = {
  services: {
    table: "services",
    select: "id, slug, name, description, category, icon, cta, is_active AS isActive, sort_order AS sortOrder, status, updated_at AS updatedAt",
    fields: { slug: "slug", name: "name", description: "description", category: "category", icon: "icon", cta: "cta", isActive: "is_active", sortOrder: "sort_order", status: "status" },
    required: ["name", "category"],
  },
  projects: {
    table: "cms_projects",
    select: "id, slug, title, description, image_url AS imageUrl, project_url AS projectUrl, category, technologies, featured, is_active AS isActive, sort_order AS sortOrder, status, updated_at AS updatedAt",
    fields: { slug: "slug", title: "title", description: "description", imageUrl: "image_url", projectUrl: "project_url", category: "category", technologies: "technologies", featured: "featured", isActive: "is_active", sortOrder: "sort_order", status: "status" },
    required: ["title", "category"],
  },
  team: {
    table: "team_members",
    select: "id, slug, name, role, biography, image_url AS imageUrl, linkedin_url AS linkedinUrl, discipline, is_active AS isActive, sort_order AS sortOrder, status, updated_at AS updatedAt",
    fields: { slug: "slug", name: "name", role: "role", biography: "biography", imageUrl: "image_url", linkedinUrl: "linkedin_url", discipline: "discipline", isActive: "is_active", sortOrder: "sort_order", status: "status" },
    required: ["name", "role"],
  },
  ctas: {
    table: "cta_blocks",
    select: "id, slug, title, label, url, context, is_active AS isActive, sort_order AS sortOrder, status, updated_at AS updatedAt",
    fields: { slug: "slug", title: "title", label: "label", url: "url", context: "context", isActive: "is_active", sortOrder: "sort_order", status: "status" },
    required: ["title", "label", "url"],
  },
} as const;

function clean(value: unknown, max = 3000) {
  return typeof value === "string" ? value.trim().slice(0, max) : value;
}

function slugify(value: unknown) {
  return String(value || "item").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 100) || `item-${Date.now()}`;
}

function normalizedValue(key: string, value: unknown) {
  if (["isActive", "featured"].includes(key)) return value === true || value === 1 || value === "1" ? 1 : 0;
  if (key === "sortOrder") return Math.max(0, Number(value) || 0);
  if (key === "status") return ["draft", "published", "archived"].includes(String(value)) ? String(value) : "draft";
  return clean(value ?? "");
}

async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new Error("Formato inválido.");
  return await request.json() as Record<string, unknown>;
}

export async function GET(_request: Request, context: { params: Promise<{ resource: string }> }) {
  const auth = await requireAdminApi("viewer");
  if (!auth.admin) return auth.response;
  const { resource } = await context.params as { resource: Resource };
  const d1 = await getD1();

  if (resource === "home" || resource === "settings") {
    const [settings, sections] = await Promise.all([
      d1.prepare("SELECT key, value, updated_at AS updatedAt, updated_by AS updatedBy FROM site_settings ORDER BY key").all(),
      d1.prepare("SELECT id, slug, title, content, is_active AS isActive, sort_order AS sortOrder, status, updated_at AS updatedAt FROM home_sections ORDER BY sort_order, id").all(),
    ]);
    return Response.json({ settings: settings.results || [], sections: sections.results || [] }, { headers: { "cache-control": "no-store" } });
  }
  if (resource === "leads") {
    const result = await d1.prepare("SELECT id, name, whatsapp, email, company, project_type AS projectType, description, problem, budget, source, status, created_at AS createdAt, updated_at AS updatedAt FROM leads ORDER BY id DESC LIMIT 250").all();
    return Response.json({ items: result.results || [] }, { headers: { "cache-control": "no-store" } });
  }
  const config = collections[resource as keyof typeof collections];
  if (!config) return Response.json({ error: "Módulo não encontrado." }, { status: 404 });
  const result = await d1.prepare(`SELECT ${config.select} FROM ${config.table} ORDER BY sort_order, id`).all();
  return Response.json({ items: result.results || [] }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request, context: { params: Promise<{ resource: string }> }) {
  const auth = await requireAdminApi("editor");
  if (!auth.admin) return auth.response;
  const { resource } = await context.params as { resource: Resource };
  const payload = await readJson(request);
  const d1 = await getD1();

  if (resource === "home" || resource === "settings") {
    const values = payload.values && typeof payload.values === "object" ? payload.values as Record<string, unknown> : {};
    const statements = Object.entries(values).slice(0, 50).map(([key, value]) =>
      d1.prepare(`INSERT INTO site_settings (key, value, updated_by) VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP`)
        .bind(key.slice(0, 100), String(clean(value, 4000) ?? ""), auth.admin!.email),
    );
    if (resource === "home" && Array.isArray(payload.sections)) {
      for (const entry of payload.sections.slice(0, 30) as Array<Record<string, unknown>>) {
        const id = Number(entry.id) || 0;
        if (!id) continue;
        statements.push(d1.prepare("UPDATE home_sections SET is_active = ?, sort_order = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .bind(entry.isActive === true ? 1 : 0, Math.max(0, Number(entry.sortOrder) || 0), auth.admin!.email, id));
      }
    }
    if (statements.length) await d1.batch(statements);
    await writeAudit(auth.admin.email, payload.publish === false ? "SAVE_DRAFT" : "PUBLISH", resource, resource, [...Object.keys(values), Array.isArray(payload.sections) ? "section-order" : ""].filter(Boolean).join(", "));
    return Response.json({ ok: true });
  }

  const config = collections[resource as keyof typeof collections];
  if (!config) return Response.json({ error: "Módulo não encontrado." }, { status: 404 });
  for (const field of config.required) if (!String(payload[field] || "").trim()) return Response.json({ error: `Campo obrigatório: ${field}` }, { status: 400 });

  const sourceFields = Object.keys(config.fields) as Array<keyof typeof config.fields>;
  const values: Record<string, unknown> = {};
  for (const key of sourceFields) values[key as string] = normalizedValue(key as string, payload[key as string]);
  values.slug = slugify(payload.slug || payload.title || payload.name);
  values.status ||= "draft";
  values.isActive = payload.isActive === false ? 0 : 1;

  const id = Number(payload.id) || 0;
  const columns = sourceFields.map((key) => config.fields[key]);
  if (id) {
    const assignments = columns.map((column) => `${column} = ?`).join(", ");
    await d1.prepare(`UPDATE ${config.table} SET ${assignments}, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(...sourceFields.map((key) => values[key as string]), auth.admin.email, id).run();
  } else {
    await d1.prepare(`INSERT INTO ${config.table} (${columns.join(", ")}, updated_by) VALUES (${columns.map(() => "?").join(", ")}, ?)`)
      .bind(...sourceFields.map((key) => values[key as string]), auth.admin.email).run();
  }
  await writeAudit(auth.admin.email, id ? "UPDATE" : "CREATE", resource, id ? String(id) : String(values.slug), String(values.status));
  return Response.json({ ok: true });
}

export async function PATCH(request: Request, context: { params: Promise<{ resource: string }> }) {
  const auth = await requireAdminApi("admin");
  if (!auth.admin) return auth.response;
  const { resource } = await context.params as { resource: Resource };
  if (resource !== "leads") return Response.json({ error: "Operação indisponível." }, { status: 405 });
  const payload = await readJson(request);
  const id = Number(payload.id) || 0;
  const status = String(payload.status || "");
  const allowed = ["new", "contacted", "qualified", "proposal", "won", "lost", "spam"];
  if (!id || !allowed.includes(status)) return Response.json({ error: "Status inválido." }, { status: 400 });
  const d1 = await getD1();
  await d1.prepare("UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(status, id).run();
  await writeAudit(auth.admin.email, "UPDATE_LEAD_STATUS", "leads", String(id), status);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request, context: { params: Promise<{ resource: string }> }) {
  const auth = await requireAdminApi("admin");
  if (!auth.admin) return auth.response;
  const { resource } = await context.params as { resource: Resource };
  const config = collections[resource as keyof typeof collections];
  if (!config) return Response.json({ error: "Módulo não encontrado." }, { status: 404 });
  const id = Number(new URL(request.url).searchParams.get("id")) || 0;
  if (!id) return Response.json({ error: "Registro inválido." }, { status: 400 });
  const d1 = await getD1();
  await d1.prepare(`UPDATE ${config.table} SET status = 'archived', is_active = 0, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(auth.admin.email, id).run();
  await writeAudit(auth.admin.email, "ARCHIVE", resource, String(id));
  return Response.json({ ok: true });
}
