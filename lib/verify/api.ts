import type {
  VerifyIdentity,
  VerifyProject,
  VerifyRequirement,
  VerifySession,
  VerifyVersion,
  VerifyWorkspace,
} from "@/domain/verify/data";

type ApiEnvelope<T> = T & { error?: string };

export class VerifyApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "VerifyApiError";
  }
}

export async function verifyApiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    credentials: "include",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  let payload: ApiEnvelope<T>;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new VerifyApiError("A API do Verify retornou uma resposta inválida.", response.status);
  }
  if (!response.ok) {
    throw new VerifyApiError(
      payload.error || "Não foi possível concluir a solicitação.",
      response.status,
    );
  }
  return payload;
}

export function getVerifySession() {
  return verifyApiRequest<VerifySession>("/api/verify/auth/session");
}

export async function getVerifyProjects(workspaces: VerifyWorkspace[]) {
  const lists = await Promise.all(
    workspaces.map(async (workspace) => {
      const { items } = await verifyApiRequest<{ items: VerifyProject[] }>(
        `/api/verify/projects?workspaceId=${encodeURIComponent(workspace.workspaceId)}`,
      );
      return items.map((project) => ({
        ...project,
        workspaceName: workspace.workspaceName,
        role: workspace.role,
      }));
    }),
  );
  return lists.flat();
}

export function getVerifyProject(workspaceId: string, projectId: string) {
  return verifyApiRequest<{ item: VerifyProject }>(
    `/api/verify/projects/${encodeURIComponent(projectId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export function getVerifyRequirements(workspaceId: string, projectId: string) {
  return verifyApiRequest<{ items: VerifyRequirement[] }>(
    `/api/verify/projects/${encodeURIComponent(projectId)}/requirements?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export function getVerifyVersions(workspaceId: string, projectId: string) {
  return verifyApiRequest<{ items: VerifyVersion[] }>(
    `/api/verify/projects/${encodeURIComponent(projectId)}/versions?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export function createVerifyProject(input: {
  workspaceId: string;
  name: string;
  description: string;
  referenceUrl: string;
}) {
  return verifyApiRequest<{ item: VerifyProject }>("/api/verify/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateVerifyProject(
  workspaceId: string,
  projectId: string,
  input: { name: string; description: string; referenceUrl: string },
) {
  return verifyApiRequest<{ item: VerifyProject }>(
    `/api/verify/projects/${encodeURIComponent(projectId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ workspaceId, ...input }),
    },
  );
}

export function createVerifyRequirement(
  workspaceId: string,
  projectId: string,
  input: Omit<VerifyRequirement, "id" | "workspaceId" | "projectId" | "createdAt" | "updatedAt">,
) {
  return verifyApiRequest<{ item: VerifyRequirement }>(
    `/api/verify/projects/${encodeURIComponent(projectId)}/requirements`,
    {
      method: "POST",
      body: JSON.stringify({ workspaceId, ...input }),
    },
  );
}

export function createVerifyVersion(
  workspaceId: string,
  projectId: string,
  input: { label: string; summary: string; deliveredAt: string },
) {
  return verifyApiRequest<{ item: VerifyVersion }>(
    `/api/verify/projects/${encodeURIComponent(projectId)}/versions`,
    {
      method: "POST",
      body: JSON.stringify({ workspaceId, ...input }),
    },
  );
}

export async function logoutVerifySession() {
  await verifyApiRequest<{ ok: boolean }>("/api/verify/auth/logout", {
    method: "POST",
    body: "{}",
  });
}

export type { VerifyIdentity };
