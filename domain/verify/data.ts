export type VerifyWorkspace = {
  workspaceId: string;
  workspaceName: string;
  role: "owner" | "admin" | "editor" | "viewer";
};

export type VerifyIdentity = {
  id: string;
  email: string;
  name: string;
  active: true;
};

export type VerifySession = {
  identity: VerifyIdentity;
  workspaces: VerifyWorkspace[];
};

export type VerifyProject = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  referenceUrl: string;
  createdAt: string;
  updatedAt: string;
  workspaceName?: string;
  role?: VerifyWorkspace["role"];
};

export type VerifyRequirement = {
  id: string;
  workspaceId: string;
  projectId: string;
  objective: string;
  description: string;
  acceptanceCriterion: string;
  verificationMethod: string;
  moduleKey: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type VerifyVersion = {
  id: string;
  workspaceId: string;
  projectId: string;
  label: string;
  summary: string;
  deliveredAt: string | null;
  createdAt: string;
};

export const modules = [
  ["M01", "Interface e navegação", "Telas, caminhos e interações definidos no escopo."],
  ["M02", "Identidade e permissões", "Acesso e permissões declaradas pelo cliente."],
  ["M03", "Processos e regras", "Comportamento esperado dos fluxos operacionais."],
  ["M04", "Dados e documentos", "Cadastro, organização e recuperação de informações."],
  ["M05", "Integrações", "Comunicação entre os serviços do projeto."],
  ["M06", "Automações e temporização", "Gatilhos e eventos no momento definido."],
  ["M07", "Transações comerciais", "Regras de transações previstas no projeto."],
  ["M08", "Inteligência artificial", "Comportamentos de IA dentro dos critérios aprovados."],
  ["M09", "Operação e desempenho", "Condições de operação e limites declarados."],
  ["M10", "Proteção e auditoria", "Rastreabilidade e proteção do escopo definido."],
] as const;
