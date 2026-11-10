import "dotenv/config";

function bool(value, fallback = false) {
  if (value == null || value === "") return fallback;
  return /^(1|true|yes|on)$/i.test(String(value));
}

export const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL || "",
  databaseSsl: bool(process.env.DATABASE_SSL),
  poolMax: Math.max(1, Number(process.env.DB_POOL_MAX || 5)),
  sessionSecret: process.env.SESSION_SECRET || "",
  sessionTtlHours: Math.max(1, Number(process.env.SESSION_TTL_HOURS || 12)),
  verifyInviteTtlHours: Math.min(72, Math.max(1, Number(process.env.VERIFY_INVITE_TTL_HOURS || 24))),
  verifySessionTtlHours: Math.min(168, Math.max(1, Number(process.env.VERIFY_SESSION_TTL_HOURS || 24))),
  verifyInviteMaxAttempts: Math.min(10, Math.max(3, Number(process.env.VERIFY_INVITE_MAX_ATTEMPTS || 5))),
  allowedOrigin: process.env.ALLOWED_ORIGIN || "http://localhost:3100",
  trustProxy: Math.max(0, Number(process.env.TRUST_PROXY || 1)),
  production: (process.env.NODE_ENV || "development") === "production",
};

export function assertProductionConfig() {
  if (!config.production) return;
  const missing = [];
  if (!config.databaseUrl) missing.push("DATABASE_URL");
  if (config.sessionSecret.length < 32) missing.push("SESSION_SECRET (mínimo 32 caracteres)");
  try {
    if (new URL(config.allowedOrigin).protocol !== "https:") {
      missing.push("ALLOWED_ORIGIN (HTTPS obrigatório)");
    }
  } catch {
    missing.push("ALLOWED_ORIGIN (URL HTTPS válida)");
  }
  if (missing.length) throw new Error(`Configuração obrigatória ausente: ${missing.join(", ")}`);
}
