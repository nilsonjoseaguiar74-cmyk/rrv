import type { Discipline } from "@/domain/models";

export const disciplines = [
  {
    id: "discipline-growth",
    slug: "growth",
    name: "Growth",
    shortName: "G",
    description: "Aquisição, mídia e inteligência de performance orientadas por dados.",
    accent: "#ff4d00",
    displayOrder: 1,
  },
  {
    id: "discipline-experience",
    slug: "experience",
    name: "Experience",
    shortName: "X",
    description: "Produtos digitais claros, úteis e construídos ao redor de pessoas.",
    accent: "#b9ff3d",
    displayOrder: 2,
  },
  {
    id: "discipline-engineering",
    slug: "engineering",
    name: "Engineering",
    shortName: "E",
    description: "Arquitetura e software resilientes para ideias que precisam escalar.",
    accent: "#4a7cff",
    displayOrder: 3,
  },
] satisfies Discipline[];
