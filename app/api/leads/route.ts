import { getD1, getDb } from "@/db";
import { leads } from "@/db/schema";

type LeadPayload = {
  name?: unknown;
  whatsapp?: unknown;
  email?: unknown;
  company?: unknown;
  projectType?: unknown;
  description?: unknown;
  problem?: unknown;
  budget?: unknown;
  source?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  website?: unknown;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.replace(/[<>]/g, "").trim().slice(0, max) : "";
}

function error(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) return error("Formato de envio inválido.", 415);
    const payload = await request.json() as LeadPayload;
    if (clean(payload.website, 120)) return Response.json({ message: "Solicitação recebida." }, { status: 201 });

    const lead = {
      name: clean(payload.name, 100),
      whatsapp: clean(payload.whatsapp, 40),
      email: clean(payload.email, 160).toLowerCase(),
      company: clean(payload.company, 160),
      projectType: clean(payload.projectType, 80),
      description: clean(payload.description, 3000),
      problem: clean(payload.problem, 3000),
      budget: clean(payload.budget, 100),
      source: clean(payload.source, 500) || "direct",
      utmSource: clean(payload.utm_source, 160),
      utmMedium: clean(payload.utm_medium, 160),
      utmCampaign: clean(payload.utm_campaign, 160),
    };

    if (lead.name.length < 2 || lead.whatsapp.length < 8 || !emailPattern.test(lead.email) || !lead.projectType || lead.description.length < 15 || lead.problem.length < 15 || !lead.budget) {
      return error("Revise os campos obrigatórios e tente novamente.", 400);
    }

    const fingerprint = clean(request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown", 100);
    const d1 = await getD1();
    const recent = await d1.prepare("SELECT COUNT(*) AS total FROM lead_rate_limits WHERE fingerprint = ? AND created_at >= datetime('now', '-10 minutes')").bind(fingerprint).first() as { total: number } | null;
    if ((recent?.total || 0) >= 5) return error("Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.", 429);

    await d1.batch([
      d1.prepare("INSERT INTO lead_rate_limits (fingerprint) VALUES (?)").bind(fingerprint),
      d1.prepare("DELETE FROM lead_rate_limits WHERE created_at < datetime('now', '-1 day')"),
    ]);

    await (await getDb()).insert(leads).values(lead);
    return Response.json({ message: "Recebemos sua ideia. A RRV entrará em contato para o diagnóstico inicial." }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (cause) {
    console.error("lead_submission_failed", cause);
    return error("Não foi possível enviar agora. Tente novamente em instantes.", 500);
  }
}
