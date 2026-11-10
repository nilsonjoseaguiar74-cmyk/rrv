import { Router } from "express";
import { query } from "../db.js";

export const publicRouter = Router();

async function settings() {
  const result = await query("SELECT key, value FROM site_settings WHERE status = 'published'");
  return Object.fromEntries(result.rows.map((row) => [row.key, row.value]));
}

publicRouter.get("/home", async (_request, response, next) => {
  try {
    const [settingValues, sections, ctas] = await Promise.all([settings(), query(`SELECT id, slug, title, content, is_active AS "isActive", sort_order AS "sortOrder"
      FROM home_sections WHERE status = 'published' ORDER BY sort_order, created_at`), query(`SELECT id,slug,title,label,url,context,sort_order AS "sortOrder" FROM cta_blocks WHERE status='published' AND is_active=true ORDER BY sort_order`)]);
    response.json({ settings: settingValues, homeSections: sections.rows, ctas: ctas.rows });
  } catch (error) { next(error); }
});

publicRouter.get("/services", async (_request, response, next) => {
  try {
    const result = await query(`SELECT id, slug, title AS name, description, category, icon, cta, sort_order AS "sortOrder"
      FROM services WHERE status = 'published' AND is_active = true ORDER BY category, sort_order, created_at`);
    response.json({ items: result.rows });
  } catch (error) { next(error); }
});

publicRouter.get("/projects", async (_request, response, next) => {
  try {
    const result = await query(`SELECT id, slug, title, description, image_url AS "imageUrl", external_url AS "projectUrl", category, technologies, featured, sort_order AS "sortOrder"
      FROM projects WHERE status = 'published' ORDER BY sort_order, created_at`);
    response.json({ items: result.rows });
  } catch (error) { next(error); }
});

publicRouter.get("/team", async (_request, response, next) => {
  try {
    const result = await query(`SELECT id, slug, name, role, bio AS biography, image_url AS "imageUrl", linkedin_url AS "linkedinUrl", discipline, sort_order AS "sortOrder"
      FROM team_members WHERE is_active = true AND status = 'published' ORDER BY sort_order, created_at`);
    response.json({ items: result.rows });
  } catch (error) { next(error); }
});
