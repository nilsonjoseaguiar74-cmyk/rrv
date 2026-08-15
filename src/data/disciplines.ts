import type { Discipline } from "@/domain/models";

export const disciplines = [
  {
    id: "discipline-growth",
    slug: "growth",
    name: "Growth",
    shortName: "G",
    description: "Aquisição, mídia e inteligência de performance orientadas por dados.",
    accent: "#bdf600",
    displayOrder: 1,
  },
  {
    id: "discipline-experience",
    slug: "experience",
    name: "Experience",
    shortName: "X",
    description: "Produtos digitais claros, úteis e construídos ao redor de pessoas.",
    accent: "#ff5d3a",
    displayOrder: 2,
  },
  {
    id: "discipline-engineering",
    slug: "engineering",
    name: "Engineering",
    shortName: "E",
    description: "Arquitetura e software resilientes para ideias que precisam escalar.",
    accent: "#9eeaff",
    displayOrder: 3,
  },
] satisfies Discipline[];
