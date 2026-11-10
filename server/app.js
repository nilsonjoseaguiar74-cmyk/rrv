import express from "express";
import helmet from "helmet";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { config, assertProductionConfig } from "./config.js";
import { healthRouter } from "./routes/health.js";
import { leadsRouter } from "./routes/leads.js";
import { authRouter } from "./routes/auth.js";
import { publicRouter } from "./routes/public.js";
import { adminRouter } from "./routes/admin.js";
import { verifyRouter } from "./routes/verify.js";
import { verifyAuthRouter } from "./routes/verify-auth.js";
import { verifyAdminRouter } from "./routes/verify-admin.js";
import { resolveVerifyIdentity } from "./middleware/verify-identity.js";
import { startVerifyExecutionWorker } from "./workers/verify-execution-worker.js";
import {
  apiSecurityHeaders,
  loginLimiter,
  leadsLimiter,
  publicApiLimiter,
  verifyInviteLimiter,
  verifyInviteAdminLimiter,
  rejectUnexpectedContentType,
} from "./api-security.js";

export async function createApp({ serveFrontend = true } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy);
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(express.json({ limit: "1mb" }));
  app.use((request, response, next) => {
    const origin = request.headers.origin;
    if (origin && origin !== config.allowedOrigin && !(!config.production && /^https?:\/\/localhost(?::\d+)?$/.test(origin))) return response.status(403).json({ error: "Origem não autorizada." });
    response.setHeader("Vary", "Origin");
    next();
  });
  // Segurança aplicada exclusivamente à superfície /api.
  app.use("/api", apiSecurityHeaders);

  // Health continua leve para monitoramento.
  app.use("/api", healthRouter);

  // Entrada pública de leads: JSON obrigatório + limite anti-spam.
  app.use(
    "/api/leads",
    leadsLimiter,
    rejectUnexpectedContentType
  );
  app.use("/api", leadsRouter);

  // Dados públicos publicados: leitura limitada contra scraping abusivo.
  app.use(
    "/api/public",
    publicApiLimiter
  );
  app.use("/api/public", publicRouter);

  // Login administrativo: proteção contra força bruta.
  app.use(
    "/api/admin/auth/login",
    loginLimiter,
    rejectUnexpectedContentType
  );

  // Demais mutações administrativas exigem JSON.
  app.use(
    "/api/admin",
    (request, response, next) => {
      if (
        ["POST", "PUT", "PATCH"].includes(request.method)
      ) {
        return rejectUnexpectedContentType(
          request,
          response,
          next
        );
      }

      next();
    }
  );

  app.use("/api/admin/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/admin/verify/invites", verifyInviteAdminLimiter);
  app.use("/api/admin/verify", verifyAdminRouter);
  app.use("/api/verify/auth/request-code", verifyInviteLimiter);
  app.use("/api/verify/auth/verify-code", verifyInviteLimiter);
  app.use("/api/verify/auth", rejectUnexpectedContentType, verifyAuthRouter);
  app.use(
    "/api/verify",
    (request, response, next) => {
      if (["POST", "PUT", "PATCH"].includes(request.method)) {
        return rejectUnexpectedContentType(request, response, next);
      }
      next();
    },
    resolveVerifyIdentity,
    verifyRouter
  );
  app.use((error, _request, response, _next) => {
    console.error("request_failed", { message: error?.message });
    response.status(500).json({ error: "Não foi possível concluir a operação." });
  });
  if (serveFrontend) {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

    // Em produção VPS, sirva os assets compilados diretamente.
    // Evita que /_next/static/* caia no handler HTML do Next.
    app.use(
      "/_next/static",
      express.static(path.join(root, ".next", "static"), {
        immutable: true,
        maxAge: "1y",
        fallthrough: false,
      })
    );

    // Assets públicos da aplicação VPS.
    app.use(
      express.static(path.join(root, "public"), {
        index: false,
        fallthrough: true,
        maxAge: config.production ? "1h" : 0,
      })
    );

    const nextModule = await import("next");
    const nextFactory = nextModule.default;
    const nextApp = nextFactory({ dev: !config.production, dir: root });
    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Entrega a URL original diretamente ao Next.
    // Não montar o handler sob wildcard do Express,
    // pois isso altera o caminho visível durante o dispatch.
    app.use((request, response) => {
      return handle(request, response);
    });
  }
  return app;
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  assertProductionConfig();
  const app = await createApp();
  app.listen(config.port, "0.0.0.0", () => {
    if (process.env.VERIFY_EXECUTION_WORKER_ENABLED !== "false") {
      startVerifyExecutionWorker();
    }
    console.log(`RRV.digital ativa na porta ${config.port}`);
  });
}
