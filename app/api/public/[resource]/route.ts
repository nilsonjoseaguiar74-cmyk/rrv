import { getPublicSiteData } from "@/lib/cms/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  const data = await getPublicSiteData();
  const headers = { "cache-control": "public, max-age=60, stale-while-revalidate=300" };
  if (resource === "home") return Response.json({ settings: data.settings, homeSections: data.homeSections, projects: data.projects, services: data.services, team: data.team, ctas: data.ctas }, { headers });
  if (resource === "services") return Response.json({ items: data.services }, { headers });
  if (resource === "projects") return Response.json({ items: data.projects }, { headers });
  if (resource === "team") return Response.json({ items: data.team }, { headers });
  return Response.json({ error: "Recurso público não encontrado." }, { status: 404 });
}
