import type { Professional } from "@/domain/models";

export const professionals = [
  {
    id: "professional-rafael-growth", slug: "rafael-growth", name: "Vitor Manoel", title: "Growth & Performance Strategist",
    shortBio: "Transforma sinais de mercado em sistemas de aquisição eficientes.",
    fullBio: "Estrategista de crescimento com atuação em mídia, aquisição, mensuração e decisões orientadas por dados.",
    portrait: { id: "media-rafael", type: "image", src: "/images/portrait-growth.svg", alt: "Retrato editorial abstrato de Vitor Manoel", width: 900, height: 1120 },
    disciplineIds: ["discipline-growth"], knowledgeIds: ["knowledge-performance", "knowledge-analytics", "knowledge-strategy"],
    socialLinks: [{ platform: "linkedin", label: "LinkedIn", href: "#contact" }], featured: true, active: true, displayOrder: 1,
  },
  {
    id: "professional-renata-experience", slug: "renata-experience", name: "Rafaela C. Alves", title: "Product & Experience Designer",
    shortBio: "Desenha produtos digitais onde clareza, intenção e identidade coexistem.",
    fullBio: "Designer de produto focada em pesquisa, interação, sistemas visuais e experiências digitais inclusivas.",
    portrait: { id: "media-renata", type: "image", src: "/images/portrait-experience.svg", alt: "Retrato editorial abstrato de Rafaela C. Alves", width: 900, height: 1120 },
    disciplineIds: ["discipline-experience"], knowledgeIds: ["knowledge-product", "knowledge-frontend", "knowledge-strategy"],
    socialLinks: [{ platform: "linkedin", label: "LinkedIn", href: "#contact" }], featured: true, active: true, displayOrder: 2,
  },
  {
    id: "professional-vitor-engineering", slug: "vitor-engineering", name: "Rodrigo Ferreira", title: "Software & Solutions Engineer",
    shortBio: "Constrói arquiteturas sólidas para produtos digitais ambiciosos.",
    fullBio: "Engenheiro fullstack especializado em arquitetura, inteligência artificial, Web3 e infraestrutura de produtos.",
    portrait: { id: "media-vitor", type: "image", src: "/images/portrait-engineering.svg", alt: "Retrato editorial abstrato de Rodrigo Ferreira", width: 900, height: 1120 },
    disciplineIds: ["discipline-engineering"], knowledgeIds: ["knowledge-frontend", "knowledge-architecture", "knowledge-ai", "knowledge-web3"],
    socialLinks: [{ platform: "github", label: "GitHub", href: "#contact" }], featured: true, active: true, displayOrder: 3,
  },
] satisfies Professional[];
