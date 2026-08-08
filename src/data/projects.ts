import type { Project } from "@/domain/models";

export const projects = [
  {
    id: "project-signal", slug: "signal-commerce", title: "Signal Commerce", subtitle: "Commerce intelligence platform",
    shortDescription: "Uma operação de commerce redesenhada como sistema contínuo de aquisição, experiência e decisão.",
    description: "Estratégia e produto digital conectando mídia, interface e dados operacionais.", challenge: "Unificar uma jornada fragmentada e sem visão compartilhada de performance.", solution: "Criar uma plataforma modular orientada pelos mesmos sinais de negócio.", results: "Base preparada para ciclos mais rápidos de experimentação e crescimento.",
    cover: { id: "media-signal-cover", type: "image", src: "/design-master/growth.png", alt: "Visual abstrato verde do projeto Signal Commerce", width: 1600, height: 1000 }, media: [],
    professionalIds: ["professional-rafael-growth", "professional-renata-experience", "professional-vitor-engineering"], knowledgeIds: ["knowledge-performance", "knowledge-analytics", "knowledge-product", "knowledge-architecture"], disciplineIds: ["discipline-growth", "discipline-experience", "discipline-engineering"],
    year: 2026, status: "launched", featured: true, published: true, displayOrder: 1,
  },
  {
    id: "project-atlas", slug: "atlas-operations", title: "Atlas Operations", subtitle: "Operational product ecosystem",
    shortDescription: "Um ecossistema operacional que torna processos complexos legíveis e acionáveis.",
    description: "Produto interno para observar, decidir e executar em uma única linguagem.", challenge: "Reduzir a distância entre dados operacionais e ação.", solution: "Modelar fluxos e interfaces ao redor de decisões prioritárias.", results: "Operação mais clara, rastreável e pronta para escalar.",
    cover: { id: "media-atlas-cover", type: "image", src: "/design-master/experience.png", alt: "Visual editorial coral do projeto Atlas Operations", width: 1600, height: 1000 }, media: [],
    professionalIds: ["professional-renata-experience", "professional-vitor-engineering"], knowledgeIds: ["knowledge-product", "knowledge-frontend", "knowledge-architecture"], disciplineIds: ["discipline-experience", "discipline-engineering"],
    year: 2025, status: "launched", featured: true, published: true, displayOrder: 2,
  },
  {
    id: "project-orbit", slug: "orbit-intelligence", title: "Orbit Intelligence", subtitle: "Applied AI decision layer",
    shortDescription: "Uma camada de inteligência aplicada que organiza contexto antes de automatizar decisões.",
    description: "Sistema assistivo desenhado para ampliar julgamento, não ocultar complexidade.", challenge: "Aplicar IA a processos sem perder transparência e controle.", solution: "Combinar contexto estruturado, revisão humana e arquitetura modular.", results: "Um conceito validado para automação responsável e evolutiva.",
    cover: { id: "media-orbit-cover", type: "image", src: "/design-master/engineering.png", alt: "Visual técnico azul do projeto Orbit Intelligence", width: 1600, height: 1000 }, media: [],
    professionalIds: ["professional-rafael-growth", "professional-vitor-engineering"], knowledgeIds: ["knowledge-analytics", "knowledge-ai", "knowledge-architecture"], disciplineIds: ["discipline-growth", "discipline-engineering"],
    year: 2026, status: "concept", featured: true, published: true, displayOrder: 3,
  },
] satisfies Project[];
