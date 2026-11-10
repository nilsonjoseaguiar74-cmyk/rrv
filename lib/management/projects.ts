export type ManagementProject = {
  id: string;
  thumbnail: string;
  title: string;
  discipline: "Growth" | "Experience" | "Engineering";
  status: "Published" | "Draft";
  featured: boolean;
  updated: string;
};

export const temporaryProjects: ManagementProject[] = [
  {
    id: "signal-growth-engine",
    thumbnail: "/work/growth.png",
    title: "Signal / Growth Engine",
    discipline: "Growth",
    status: "Published",
    featured: true,
    updated: "11 Aug 2026",
  },
  {
    id: "arc-product-experience",
    thumbnail: "/work/experience.png",
    title: "Arc / Product Experience",
    discipline: "Experience",
    status: "Published",
    featured: true,
    updated: "11 Aug 2026",
  },
  {
    id: "core-execution-layer",
    thumbnail: "/work/engineering.png",
    title: "Core / Execution Layer",
    discipline: "Engineering",
    status: "Published",
    featured: true,
    updated: "11 Aug 2026",
  },
];
