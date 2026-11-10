export type Result =
  | "Atendido"
  | "Não atendido"
  | "Bloqueado"
  | "Inconclusivo"
  | "Não avaliado";
export type Requirement = {
  id: string;
  objective: string;
  description: string;
  criterion: string;
  method: string;
  module: string;
  implemented: boolean;
  results: Result[];
  evidence: string;
  note: string;
};
export type Project = {
  id: string;
  name: string;
  description: string;
  url: string;
  owner: string;
  market: string;
  segment: string;
  audience: string;
  types: string[];
  flows: string;
  procedures: string;
  objectives: string;
  modules: string[];
  customModules?: string[][];
  requirements: Requirement[];
};
export const versions = [
  {
    name: "v0.1",
    date: "21 out 2026",
    iso: "2026-10-21",
    title: "Escopo inicial",
    note: "Critérios definidos pelo cliente.",
  },
  {
    name: "v0.2",
    date: "28 out 2026",
    iso: "2026-10-28",
    title: "Primeira evolução",
    note: "Desenvolvedor informou correção em REQ-02. Resultado preservado até nova avaliação.",
  },
  {
    name: "v0.3",
    date: "04 nov 2026",
    iso: "2026-11-04",
    title: "Nova avaliação",
    note: "Cenário sintético: REQ-02 atendido em uma nova avaliação demonstrativa.",
  },
];
export const modules = [
  [
    "M01",
    "Interface e navegação",
    "Telas, caminhos e interações definidos no escopo.",
  ],
  [
    "M02",
    "Identidade e permissões",
    "Acesso e permissões declaradas pelo cliente.",
  ],
  [
    "M03",
    "Processos e regras",
    "Comportamento esperado dos fluxos operacionais.",
  ],
  [
    "M04",
    "Dados e documentos",
    "Cadastro, organização e recuperação de informações.",
  ],
  ["M05", "Integrações", "Comunicação entre os serviços do projeto."],
  [
    "M06",
    "Automações e temporização",
    "Gatilhos e eventos no momento definido.",
  ],
  [
    "M07",
    "Transações comerciais",
    "Regras de transações previstas no projeto.",
  ],
  [
    "M08",
    "Inteligência artificial",
    "Comportamentos de IA dentro dos critérios aprovados.",
  ],
  [
    "M09",
    "Operação e desempenho",
    "Condições de operação e limites declarados.",
  ],
  [
    "M10",
    "Proteção e auditoria",
    "Rastreabilidade e proteção do escopo definido.",
  ],
];
export const states: Result[] = [
  "Atendido",
  "Não atendido",
  "Bloqueado",
  "Inconclusivo",
  "Não avaliado",
];
export const initialProjects: Project[] = [
  {
    id: "singulai",
    name: "SingulAI",
    description: "Legado digital que atravessa o tempo.",
    url: "https://singulai.site",
    owner: "Rodrigo Alves",
    market: "Tecnologia",
    segment: "Legado digital",
    audience: "Pessoas que desejam preservar seu legado digital",
    types: ["Aplicação web", "Inteligência artificial", "Blockchain/Web3"],
    flows:
      "Entrada com Google → dashboard → carteira integrada → avatares e cápsulas do tempo.",
    procedures:
      "Acesso individual, rede Sepolia e créditos demonstrativos para testes.",
    objectives: "Preservar memórias por meio de avatares e cápsulas do tempo.",
    modules: ["M01", "M02", "M04", "M05", "M06", "M08", "M10"],
    requirements: [
      {
        id: "REQ-01",
        objective: "Simplificar a entrada",
        description: "Entrada com conta Google",
        criterion: "O usuário acessa seu dashboard após a entrada com Google.",
        method: "Percurso funcional demonstrativo",
        module: "M02",
        implemented: true,
        results: ["Atendido", "Atendido", "Atendido"],
        evidence:
          "E-001 · Exemplo sintético de registro do fluxo de entrada. Não é um teste executado.",
        note: "Cenário ilustrativo de conclusão do fluxo.",
      },
      {
        id: "REQ-02",
        objective: "Consultar o ambiente pessoal",
        description: "Dashboard do usuário",
        criterion: "O dashboard apresenta os avatares e cápsulas do usuário.",
        method: "Inspeção de interface demonstrativa",
        module: "M01",
        implemented: true,
        results: ["Não atendido", "Não atendido", "Atendido"],
        evidence:
          "E-002 · Registro textual fictício do dashboard na versão selecionada.",
        note: "Correção informada em v0.2; nova avaliação ilustrativa em v0.3.",
      },
      {
        id: "REQ-03",
        objective: "Disponibilizar a carteira",
        description: "Carteira blockchain integrada",
        criterion:
          "A carteira é apresentada com a rede de testes Sepolia selecionada.",
        method: "Consulta de estado demonstrativa",
        module: "M05",
        implemented: true,
        results: ["Bloqueado", "Atendido", "Atendido"],
        evidence: "E-003 · Exemplo sintético do estado da rede Sepolia.",
        note: "Nenhuma carteira real foi acessada.",
      },
      {
        id: "REQ-04",
        objective: "Permitir experimentação",
        description: "Créditos demonstrativos SGL",
        criterion:
          "O usuário visualiza o saldo de 10.000 SGL para testes na Sepolia.",
        method: "Inspeção de saldo demonstrativa",
        module: "M05",
        implemented: true,
        results: ["Não avaliado", "Atendido", "Atendido"],
        evidence:
          "E-004 · Representação textual fictícia de saldo. Sem transação real.",
        note: "Créditos exclusivamente ilustrativos.",
      },
      {
        id: "REQ-05",
        objective: "Preservar memórias",
        description: "Cadastro de avatares",
        criterion: "O avatar cadastrado é listado no dashboard do usuário.",
        method: "Percurso de cadastro demonstrativo",
        module: "M08",
        implemented: true,
        results: ["Não avaliado", "Não atendido", "Não atendido"],
        evidence:
          "E-005 · Cenário sintético: o avatar enviado não aparece na listagem.",
        note: "Implementado no cenário fictício, mas não atende ao critério.",
      },
      {
        id: "REQ-06",
        objective: "Programar uma entrega futura",
        description: "Cápsulas do tempo",
        criterion: "A cápsula é liberada para o beneficiário na data definida.",
        method: "Simulação temporal demonstrativa",
        module: "M06",
        implemented: false,
        results: ["Não avaliado", "Bloqueado", "Bloqueado"],
        evidence:
          "E-006 · Exemplo de bloqueio por indisponibilidade do agendador.",
        note: "Não implementado neste cenário; o resultado não representa falha de implementação testada.",
      },
      {
        id: "REQ-07",
        objective: "Preservar a rastreabilidade",
        description: "Histórico de operações",
        criterion: "Cada operação exibe data, tipo e identificador.",
        method: "Consulta de registro demonstrativa",
        module: "M10",
        implemented: true,
        results: ["Não avaliado", "Inconclusivo", "Inconclusivo"],
        evidence:
          "E-007 · Amostra fictícia insuficiente para concluir o critério.",
        note: "O material ilustrativo não permite uma conclusão.",
      },
      {
        id: "REQ-08",
        objective: "Revisitar informações",
        description: "Consulta de cápsulas salvas",
        criterion:
          "O usuário encontra suas cápsulas após retornar ao dashboard.",
        method: "Percurso de consulta demonstrativo",
        module: "M04",
        implemented: false,
        results: ["Não avaliado", "Não avaliado", "Não avaliado"],
        evidence: "Sem evidência associada.",
        note: "Não avaliado; ausência de avaliação não significa aprovação.",
      },
    ],
  },
];
