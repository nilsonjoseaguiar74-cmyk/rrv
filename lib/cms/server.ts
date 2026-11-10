import { getD1 } from "@/db";
import { defaultCtas, defaultHomeSections, defaultProjects, defaultServices, defaultSettings, defaultTeam, type PublicCta, type PublicHomeSection, type PublicProject, type PublicService, type PublicTeamMember } from "@/lib/cms/defaults";

export type PublicSiteData = {
  settings: Record<string, string>;
  projects: PublicProject[];
  services: PublicService[];
  team: PublicTeamMember[];
  ctas: PublicCta[];
  homeSections: PublicHomeSection[];
};

function booleanValue(value: unknown) {
  return value === 1 || value === true;
}

export async function getPublicSiteData(): Promise<PublicSiteData> {
  try {
    const d1 = await getD1();
    const [settingsResult, sectionsResult, projectsResult, servicesResult, teamResult, ctasResult] = await Promise.all([
      d1.prepare("SELECT key, value FROM site_settings").all(),
      d1.prepare("SELECT id, slug, title, content, is_active AS isActive, sort_order AS sortOrder FROM home_sections WHERE status = 'published' ORDER BY sort_order, id").all(),
      d1.prepare("SELECT id, slug, title, description, image_url AS imageUrl, project_url AS projectUrl, category, technologies, featured, sort_order AS sortOrder FROM cms_projects WHERE status = 'published' AND is_active = 1 ORDER BY sort_order, id").all(),
      d1.prepare("SELECT id, slug, name, description, category, icon, cta, sort_order AS sortOrder FROM services WHERE status = 'published' AND is_active = 1 ORDER BY category, sort_order, id").all(),
      d1.prepare("SELECT id, slug, name, role, biography, image_url AS imageUrl, linkedin_url AS linkedinUrl, discipline, sort_order AS sortOrder FROM team_members WHERE status = 'published' AND is_active = 1 ORDER BY sort_order, id").all(),
      d1.prepare("SELECT id, slug, title, label, url, context, sort_order AS sortOrder FROM cta_blocks WHERE status = 'published' AND is_active = 1 ORDER BY sort_order, id").all(),
    ]);

    const settings = { ...defaultSettings };
    for (const row of (settingsResult.results || []) as Array<{ key: string; value: string }>) settings[row.key] = row.value;
    const homeSections = ((sectionsResult.results || []) as Array<Record<string, unknown>>).map((row) => ({ ...row, isActive: booleanValue(row.isActive) })) as PublicHomeSection[];
    const projects = ((projectsResult.results || []) as Array<Record<string, unknown>>).map((row) => ({ ...row, featured: booleanValue(row.featured) })) as PublicProject[];
    const services = (servicesResult.results || []) as unknown as PublicService[];
    const team = (teamResult.results || []) as unknown as PublicTeamMember[];
    const ctas = (ctasResult.results || []) as unknown as PublicCta[];
    return {
      settings,
      projects: projects.length ? projects : defaultProjects,
      services: services.length ? services : defaultServices,
      team: team.length ? team : defaultTeam,
      ctas: ctas.length ? ctas : defaultCtas,
      homeSections: homeSections.length ? homeSections : defaultHomeSections,
    };
  } catch (cause) {
    console.warn("cms_public_fallback", cause);
    return { settings: defaultSettings, projects: defaultProjects, services: defaultServices, team: defaultTeam, ctas: defaultCtas, homeSections: defaultHomeSections };
  }
}

export async function seedCmsDefaults(actorEmail: string) {
  const d1 = await getD1();
  const statements = [];
  for (const [key, value] of Object.entries(defaultSettings)) {
    statements.push(d1.prepare("INSERT OR IGNORE INTO site_settings (key, value, updated_by) VALUES (?, ?, ?)").bind(key, value, actorEmail));
  }
  for (const section of defaultHomeSections) {
    statements.push(d1.prepare(`INSERT OR IGNORE INTO home_sections (slug, title, content, is_active, sort_order, status, updated_by)
      VALUES (?, ?, ?, ?, ?, 'published', ?)`)
      .bind(section.slug, section.title, section.content, section.isActive ? 1 : 0, section.sortOrder, actorEmail));
  }
  for (const project of defaultProjects) {
    statements.push(d1.prepare(`INSERT OR IGNORE INTO cms_projects (slug, title, description, image_url, project_url, category, technologies, featured, is_active, sort_order, status, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'published', ?)`)
      .bind(project.slug, project.title, project.description, project.imageUrl, project.projectUrl, project.category, project.technologies, project.featured ? 1 : 0, project.sortOrder, actorEmail));
  }
  for (const service of defaultServices) {
    statements.push(d1.prepare(`INSERT OR IGNORE INTO services (slug, name, description, category, icon, cta, is_active, sort_order, status, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, 'published', ?)`)
      .bind(service.slug, service.name, service.description, service.category, service.icon, service.cta, service.sortOrder, actorEmail));
  }
  for (const member of defaultTeam) {
    statements.push(d1.prepare(`INSERT OR IGNORE INTO team_members (slug, name, role, biography, image_url, linkedin_url, discipline, is_active, sort_order, status, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 'published', ?)`)
      .bind(member.slug, member.name, member.role, member.biography, member.imageUrl, member.linkedinUrl, member.discipline, member.sortOrder, actorEmail));
  }
  for (const cta of defaultCtas) {
    statements.push(d1.prepare(`INSERT OR IGNORE INTO cta_blocks (slug, title, label, url, context, is_active, sort_order, status, updated_by)
      VALUES (?, ?, ?, ?, ?, 1, ?, 'published', ?)`)
      .bind(cta.slug, cta.title, cta.label, cta.url, cta.context, cta.sortOrder, actorEmail));
  }
  for (let index = 0; index < statements.length; index += 75) await d1.batch(statements.slice(index, index + 75));
}
