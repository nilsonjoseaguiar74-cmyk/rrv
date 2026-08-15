import type { Knowledge } from "@/domain/models";

export const knowledge = [
  { id: "knowledge-performance", slug: "performance-media", name: "Performance Media", category: "growth", description: "Estratégia, operação e otimização de mídia para crescimento mensurável.", icon: "↗", featured: true, active: true, displayOrder: 1 },
  { id: "knowledge-analytics", slug: "analytics", name: "Analytics", category: "strategy", description: "Instrumentação e leitura de dados para decisões com contexto.", icon: "◎", featured: true, active: true, displayOrder: 2 },
  { id: "knowledge-product", slug: "product-design", name: "Product Design", category: "design", description: "Sistemas de interface que transformam complexidade em uso simples.", icon: "◇", featured: true, active: true, displayOrder: 3 },
  { id: "knowledge-frontend", slug: "frontend", name: "Frontend", category: "engineering", description: "Experiências web rápidas, acessíveis e fiéis à direção de produto.", icon: "⌁", featured: true, active: true, displayOrder: 4 },
  { id: "knowledge-architecture", slug: "architecture", name: "Architecture", category: "engineering", description: "Sistemas modulares preparados para evolução contínua.", icon: "⌘", featured: true, active: true, displayOrder: 5 },
  { id: "knowledge-ai", slug: "applied-ai", name: "Applied AI", category: "engineering", description: "Inteligência aplicada a fluxos reais, com responsabilidade e propósito.", icon: "✦", featured: true, active: true, displayOrder: 6 },
  { id: "knowledge-strategy", slug: "digital-strategy", name: "Digital Strategy", category: "strategy", description: "Direção integrada entre mercado, produto e tecnologia.", icon: "→", featured: false, active: true, displayOrder: 7 },
  { id: "knowledge-web3", slug: "web3", name: "Web3", category: "engineering", description: "Contratos e produtos descentralizados desenhados para utilidade.", icon: "⬡", featured: false, active: true, displayOrder: 8 },
] satisfies Knowledge[];
