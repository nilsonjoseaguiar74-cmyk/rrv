import { resolveVerifySession } from "../services/verify-auth.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isVerifyIdentity(identity) {
  return (
    identity &&
    typeof identity === "object" &&
    typeof identity.id === "string" &&
    UUID_PATTERN.test(identity.id) &&
    identity.active === true
  );
}

export function requireVerifyIdentity(request, response, next) {
  // Only a future trusted customer-identity adapter may set this context; admin sessions are intentionally ignored.
  if (!isVerifyIdentity(request.verifyIdentity)) {
    return response.status(401).json({
      error: "Autenticação de clientes do Verify ainda não está integrada.",
      code: "VERIFY_IDENTITY_REQUIRED",
    });
  }
  next();
}

export function resolveVerifyIdentity(request, _response, next) {
  request.verifyIdentity = null;
  Promise.resolve(resolveVerifySession(request))
    .then((session) => {
      request.verifyIdentity = session?.identity || null;
      next();
    })
    .catch(next);
}
