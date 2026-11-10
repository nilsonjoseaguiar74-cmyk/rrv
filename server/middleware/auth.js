import { resolveSession, roles } from "../auth/session.js";

export function requireRole(minimum = "viewer") {
  return async (request, response, next) => {
    try {
      const user = await resolveSession(request);
      if (!user) return response.status(401).json({ error: "Sessão administrativa inválida ou expirada." });
      if (!(user.role in roles) || roles[user.role] < roles[minimum]) return response.status(403).json({ error: "Seu perfil não possui permissão para esta ação." });
      request.admin = user;
      next();
    } catch (error) { next(error); }
  };
}
