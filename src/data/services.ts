import type { Service } from "@/domain/models";

type ServiceSeed = readonly [string, string, string, string, string, string[]];

const growth: ServiceSeed[] = [
  ["paid-media", "Paid Media", "Mídia orientada a crescimento rentável.", "Planejamento, operação e otimização contínua de campanhas.", "target", ["knowledge-performance"]],
  ["growth-strategy", "Growth Strategy", "Hipóteses conectadas a metas reais.", "Estratégia de crescimento, priorização e ciclos de experimentação.", "trend", ["knowledge-strategy", "knowledge-analytics"]],
  ["performance-creative", "Performance Creative", "Criatividade que aprende com sinais.", "Sistema de conceitos, variações e leitura de performance criativa.", "signal", ["knowledge-performance", "knowledge-product"]],
  ["media-planning", "Media Planning", "Investimento distribuído com intenção.", "Arquitetura de canais, públicos, orçamento e frequência.", "campaign", ["knowledge-performance"]],
  ["conversion-optimization", "Conversion Optimization", "Jornadas refinadas por evidência.", "Diagnóstico e experimentos para reduzir atrito e ampliar conversão.", "conversion", ["knowledge-analytics", "knowledge-product"]],
  ["analytics-measurement", "Analytics & Measurement", "Métricas que explicam decisões.", "Planos de mensuração, dashboards e leitura de comportamento.", "analytics", ["knowledge-analytics"]],
  ["acquisition-systems", "Acquisition Systems", "Aquisição como sistema, não campanha.", "Integração de canais, produto, dados e rotinas operacionais.", "nodes", ["knowledge-performance", "knowledge-architecture"]],
  ["crm-lifecycle", "CRM & Lifecycle", "Relacionamentos úteis em cada estágio.", "Estratégias de ativação, retenção e comunicação de ciclo de vida.", "branch", ["knowledge-strategy", "knowledge-analytics"]],
  ["seo-content", "SEO & Content", "Demanda construída com relevância.", "Estratégia editorial e técnica para descoberta orgânica.", "search", ["knowledge-strategy", "knowledge-analytics"]],
  ["marketing-automation", "Marketing Automation", "Operações escaláveis e mensuráveis.", "Fluxos automatizados conectados a eventos e intenção.", "funnel", ["knowledge-analytics", "knowledge-architecture"]],
  ["market-intelligence", "Market Intelligence", "Contexto para escolher onde competir.", "Pesquisa, sinais competitivos e leitura de oportunidade.", "radar", ["knowledge-strategy", "knowledge-analytics"]],
  ["go-to-market", "Go-to-Market", "Oferta, canal e narrativa alinhados.", "Plano de entrada e evolução orientado pelo mercado.", "launch", ["knowledge-strategy", "knowledge-performance"]],
];

const experience: ServiceSeed[] = [
  ["product-design", "Product Design", "Produtos claros do fluxo ao detalhe.", "Estratégia, interação e interface para produtos digitais.", "frame", ["knowledge-product"]],
  ["ux-research", "UX Research", "Decisões ancoradas em comportamento.", "Pesquisa qualitativa e validação de necessidades e conceitos.", "cursor", ["knowledge-product", "knowledge-strategy"]],
  ["ui-design", "Interface Design", "Precisão visual com propósito.", "Interfaces distintivas, coerentes e acessíveis.", "layers", ["knowledge-product"]],
  ["design-systems", "Design Systems", "Consistência que acelera evolução.", "Tokens, componentes e governança para múltiplos produtos.", "grid", ["knowledge-product", "knowledge-frontend"]],
  ["interaction-design", "Interaction Design", "Movimento que esclarece ação.", "Estados, transições e feedbacks que orientam o uso.", "interaction", ["knowledge-product", "knowledge-frontend"]],
  ["prototyping", "Prototyping", "Ideias testáveis antes do custo alto.", "Protótipos de fidelidade adequada para aprender com rapidez.", "prototype", ["knowledge-product"]],
  ["product-strategy", "Product Strategy", "Visão traduzida em escolhas.", "Definição de problema, proposta de valor e direção de produto.", "compass", ["knowledge-strategy", "knowledge-product"]],
  ["service-design", "Service Design", "Experiências além da tela.", "Orquestração de jornadas, processos e pontos de contato.", "route", ["knowledge-product", "knowledge-strategy"]],
  ["accessibility", "Digital Accessibility", "Qualidade de uso para mais pessoas.", "Práticas e avaliações inclusivas desde a concepção.", "access", ["knowledge-product", "knowledge-frontend"]],
  ["content-design", "Content Design", "Linguagem que reduz complexidade.", "Arquitetura de informação, nomenclatura e conteúdo de interface.", "text", ["knowledge-product"]],
  ["brand-experience", "Digital Brand Experience", "Identidade viva em cada interação.", "Expressão digital da marca em sistemas e produtos.", "spark", ["knowledge-product", "knowledge-strategy"]],
  ["product-evolution", "Product Evolution", "Melhoria contínua com direção.", "Diagnóstico e evolução incremental de experiências existentes.", "cycle", ["knowledge-product", "knowledge-analytics"]],
];

const engineering: ServiceSeed[] = [
  ["frontend-engineering", "Frontend Engineering", "Interfaces rápidas, robustas e acessíveis.", "Engenharia frontend orientada a produto e qualidade.", "terminal", ["knowledge-frontend"]],
  ["fullstack-development", "Fullstack Development", "Produtos completos, módulos claros.", "Aplicações web da interface à persistência.", "nodes", ["knowledge-frontend", "knowledge-architecture"]],
  ["solution-architecture", "Solution Architecture", "Estruturas preparadas para mudança.", "Decisões técnicas, limites de sistema e planos de evolução.", "architecture", ["knowledge-architecture"]],
  ["applied-ai", "Applied AI", "Inteligência inserida em fluxos reais.", "Soluções assistivas com contexto, avaliação e controle.", "network", ["knowledge-ai", "knowledge-architecture"]],
  ["ai-automation", "AI Automation", "Automação responsável de trabalho repetível.", "Agentes e pipelines com revisão, observabilidade e limites.", "branch", ["knowledge-ai", "knowledge-architecture"]],
  ["integrations-apis", "Integrations & APIs", "Sistemas que conversam com clareza.", "Contratos, integrações e APIs resilientes.", "plug", ["knowledge-architecture"]],
  ["cloud-devops", "Cloud & DevOps", "Entrega confiável e operação legível.", "Infraestrutura, automação de entrega e observabilidade.", "cloud", ["knowledge-architecture"]],
  ["data-platforms", "Data Platforms", "Dados úteis, governados e disponíveis.", "Pipelines, modelagem e camadas de acesso a dados.", "database", ["knowledge-analytics", "knowledge-architecture"]],
  ["web3-products", "Web3 Products", "Descentralização aplicada a utilidade.", "Produtos on-chain com experiência compreensível.", "hex", ["knowledge-web3", "knowledge-product"]],
  ["smart-contracts", "Smart Contracts", "Regras executáveis com segurança.", "Arquitetura, implementação e integração de contratos.", "contract", ["knowledge-web3", "knowledge-architecture"]],
  ["technical-discovery", "Technical Discovery", "Risco técnico tornado visível cedo.", "Investigação, provas de conceito e planejamento técnico.", "search", ["knowledge-architecture", "knowledge-strategy"]],
  ["platform-modernization", "Platform Modernization", "Evolução sem apagar o que funciona.", "Modernização incremental de aplicações e arquitetura.", "layers", ["knowledge-architecture", "knowledge-frontend"]],
];

const disciplineConfig = [
  { id: "discipline-growth", context: "growth", expert: "professional-rafael-growth", seeds: growth },
  { id: "discipline-experience", context: "experience", expert: "professional-renata-experience", seeds: experience },
  { id: "discipline-engineering", context: "engineering", expert: "professional-vitor-engineering", seeds: engineering },
] as const;

export const services: Service[] = disciplineConfig.flatMap((group, groupIndex) =>
  group.seeds.map(([slug, name, shortDescription, description, icon, knowledgeIds], index) => ({
    id: `service-${slug}`,
    slug,
    name,
    shortDescription,
    description,
    disciplineId: group.id,
    expertIds: [group.expert],
    knowledgeIds: [...knowledgeIds],
    relatedProjectIds: groupIndex === 0 ? ["project-signal", "project-orbit"] : groupIndex === 1 ? ["project-atlas", "project-signal"] : ["project-orbit", "project-atlas"],
    icon,
    visualVariant: (["signal", "editorial", "technical", "system"] as const)[index % 4],
    ctaLabel: `Explorar ${name}`,
    ctaUrl: `mailto:hello@rrv.digital?subject=${encodeURIComponent(`RRV — ${name}`)}`,
    ctaTarget: "_self",
    featured: index < 4,
    active: true,
    displayOrder: groupIndex * 12 + index + 1,
  })),
);
