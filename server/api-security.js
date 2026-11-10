/*
 * RRV.digital
 * Proteções específicas para /api.
 * Não altera frontend, NGINX ou banco.
 */

const buckets = new Map();

function clientKey(request, scope) {
  return `${scope}:${request.ip || request.socket?.remoteAddress || "unknown"}`;
}

function rateLimit({ scope, limit, windowMs }) {
  return (request, response, next) => {
    const now = Date.now();
    const key = clientKey(request, scope);

    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = {
        count: 0,
        resetAt: now + windowMs,
      };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    const remaining = Math.max(0, limit - bucket.count);

    response.setHeader(
      "RateLimit-Limit",
      String(limit)
    );

    response.setHeader(
      "RateLimit-Remaining",
      String(remaining)
    );

    response.setHeader(
      "RateLimit-Reset",
      String(Math.ceil(bucket.resetAt / 1000))
    );

    if (bucket.count > limit) {
      const retryAfter = Math.max(
        1,
        Math.ceil((bucket.resetAt - now) / 1000)
      );

      response.setHeader(
        "Retry-After",
        String(retryAfter)
      );

      return response.status(429).json({
        error: "Muitas requisições. Tente novamente em instantes.",
      });
    }

    next();
  };
}

export const loginLimiter = rateLimit({
  scope: "login",
  limit: 5,
  windowMs: 60 * 1000,
});

export const leadsLimiter = rateLimit({
  scope: "leads",
  limit: 10,
  windowMs: 10 * 60 * 1000,
});

export const publicApiLimiter = rateLimit({
  scope: "public",
  limit: 120,
  windowMs: 60 * 1000,
});

export const verifyInviteLimiter = rateLimit({
  scope: "verify-access",
  limit: 5,
  windowMs: 15 * 60 * 1000,
});

export const verifyInviteAdminLimiter = rateLimit({
  scope: "verify-invite-admin",
  limit: 10,
  windowMs: 60 * 60 * 1000,
});

export function apiSecurityHeaders(
  _request,
  response,
  next
) {
  response.setHeader(
    "Cache-Control",
    "no-store"
  );

  response.setHeader(
    "X-Content-Type-Options",
    "nosniff"
  );

  response.setHeader(
    "X-Frame-Options",
    "DENY"
  );

  response.setHeader(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );

  next();
}

export function rejectUnexpectedContentType(
  request,
  response,
  next
) {
  if (
    ["POST", "PUT", "PATCH"].includes(request.method)
  ) {
    const type = request.get("content-type") || "";

    if (
      !type
        .toLowerCase()
        .startsWith("application/json")
    ) {
      return response.status(415).json({
        error: "Content-Type não suportado.",
      });
    }
  }

  next();
}

/*
 * Evita crescimento ilimitado da estrutura em memória.
 */
setInterval(() => {
  const now = Date.now();

  for (const [key, value] of buckets) {
    if (value.resetAt <= now) {
      buckets.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();
