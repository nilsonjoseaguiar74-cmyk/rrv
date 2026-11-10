import { Router } from "express";
import { query } from "../db.js";

export const leadsRouter = Router();
const attempts = new Map();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value, max = 3000) => typeof value === "string" ? value.trim().slice(0, max) : "";

leadsRouter.post("/leads", async (request, response, next) => {
  try {
    if (clean(request.body?.website, 120)) return response.status(201).json({ message: "Solicitação recebida." });
    const lead = {
      name: clean(request.body?.name, 100), whatsapp: clean(request.body?.whatsapp, 40), email: clean(request.body?.email, 160).toLowerCase(),
      company: clean(request.body?.company, 160), projectType: clean(request.body?.projectType || request.body?.project_type, 80),
      description: clean(request.body?.description, 3000), problem: clean(request.body?.problem, 3000), budget: clean(request.body?.budget, 100),
      ref: clean(request.body?.ref || request.body?.source, 500), utmSource: clean(request.body?.utm_source, 160), utmMedium: clean(request.body?.utm_medium, 160),
      utmCampaign: clean(request.body?.utm_campaign, 160), utmContent: clean(request.body?.utm_content, 160), utmTerm: clean(request.body?.utm_term, 160),
    };
    const consent = request.body?.consent === true || request.body?.consent === "on" || request.body?.privacy === "on";
    if (lead.name.length < 2 || lead.whatsapp.length < 8 || !emailPattern.test(lead.email) || !lead.projectType || lead.description.length < 15 || !lead.budget || !consent) {
      return response.status(400).json({ error: "Revise os campos obrigatórios e aceite a política de privacidade." });
    }
    const fingerprint = String(request.ip || "unknown");
    const now = Date.now();
    const recent = (attempts.get(fingerprint) || []).filter((time) => now - time < 600_000);
    if (recent.length >= 5) return response.status(429).json({ error: "Muitas tentativas. Aguarde alguns minutos." });
    recent.push(now); attempts.set(fingerprint, recent);
    await query(`INSERT INTO leads
      (name, whatsapp, email, company, project_type, description, problem, budget, ref, utm_source, utm_medium, utm_campaign, utm_content, utm_term, consent_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now())`,
      [lead.name, lead.whatsapp, lead.email, lead.company, lead.projectType, lead.description, lead.problem, lead.budget, lead.ref, lead.utmSource, lead.utmMedium, lead.utmCampaign, lead.utmContent, lead.utmTerm]);
    response.status(201).json({ message: "Recebemos sua ideia. A RRV entrará em contato para o diagnóstico inicial." });
  } catch (error) { next(error); }
});
