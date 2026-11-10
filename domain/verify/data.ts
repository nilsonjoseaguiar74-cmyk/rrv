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

export type VerifyEvidence = {
  id: string;
  title: string;
  url: string;
  notes: string;
  createdAt: string;
};

export type VerifyValidation = {
  id: string;
  workspaceId: string;
  projectId: string;
  requirementId: string;
  objective: string;
  requirementDescription: string;
  acceptanceCriterion: string;
  versionId: string | null;
  versionLabel: string | null;
  status: "passed" | "failed" | "blocked";
  summary: string;
  createdAt: string;
  evidence: VerifyEvidence[];
};

export type VerifyExecutionStatus = "queued" | "running" | "passed" | "failed" | "cancelled";

export type VerifyExecutionTestKey =
  | "local-page-smoke"
  | "local-lighthouse-audit"
  | "local-axe-audit";

export type VerifyExecutionAnalysis = {
  status: "available" | "unavailable";
  model: string;
  summary: string | null;
  message?: string;
};

export type VerifyExecutionResult = {
  testKey: VerifyExecutionTestKey;
  label?: string;
  browser?: string;
  pageTitle?: string;
  durationMs?: number;
  error?: string;
  analysis?: VerifyExecutionAnalysis;
  assertions?: Array<{ name: string; passed: boolean; message?: string }>;
  lighthouse?: {
    version: string;
    fetchTime: string;
    categories: Record<string, { title: string; score: number | null } | null>;
    metrics: Array<{
      id: string;
      title: string;
      score: number | null;
      numericValue?: number;
      numericUnit?: string;
      displayValue?: string;
    }>;
    audits: Array<{
      id: string;
      title: string;
      description: string;
      score: number | null;
      scoreDisplayMode: string;
      displayValue?: string;
      numericValue?: number;
      numericUnit?: string;
      errorMessage?: string;
      details?: {
        type?: string;
        overallSavingsMs?: number;
        overallSavingsBytes?: number;
        items?: Array<Record<string, string | number | boolean>>;
      };
    }>;
  };
  axe?: {
    version: string;
    violationsCount: number;
    passesCount: number;
    incompleteCount: number;
    inapplicableCount: number;
    violations: Array<{
      id: string;
      impact: string;
      help: string;
      helpUrl: string;
      tags: string[];
      criteria: string[];
      nodes: Array<{ target: string[]; html: string; failureSummary: string }>;
    }>;
  };
};

export type VerifyExecution = {
  id: string;
  projectId: string;
  requirementId: string;
  testKey: VerifyExecutionTestKey;
  status: VerifyExecutionStatus;
  results: VerifyExecutionResult[];
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  evidence: {
    id: string;
    mediaType: "image/png";
    byteLength: number;
    sha256: string;
    url: string;
    createdAt: string;
  } | null;
};

export type VerifyHistoryEntry = {
  id: string;
  action: string;
  details: Record<string, unknown>;
  createdAt: string;
  actorName: string | null;
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
