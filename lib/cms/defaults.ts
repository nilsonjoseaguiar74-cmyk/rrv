export type PublicProject = {
  id: number | string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  projectUrl: string;
  category: "growth" | "experience" | "engineering";
  technologies: string;
  featured: boolean;
  sortOrder: number;
};

export type PublicService = {
  id: number | string;
  slug: string;
  name: string;
  description: string;
  category: "growth" | "experience" | "engineering";
  icon: string;
  cta: string;
  sortOrder: number;
};

export type PublicTeamMember = {
  id: number | string;
  slug: string;
  name: string;
  role: string;
  biography: string;
  imageUrl: string;
  linkedinUrl: string;
  discipline: "growth" | "experience" | "engineering";
  sortOrder: number;
};

export type PublicCta = {
  id: number | string;
  slug: string;
  title: string;
  label: string;
  url: string;
  context: string;
  sortOrder: number;
};

export type PublicHomeSection = { id: number | string; slug: string; title: string; content: string; isActive: boolean; sortOrder: number };

export const defaultHomeSections: PublicHomeSection[] = [
  { id: "home-hero", slug: "hero", title: "Hero", content: "", isActive: true, sortOrder: 1 },
  { id: "home-work", slug: "work", title: "Selected Work", content: "", isActive: true, sortOrder: 2 },
  { id: "home-services", slug: "services", title: "Services", content: "", isActive: true, sortOrder: 3 },
  { id: "home-disciplines", slug: "disciplines", title: "Disciplines", content: "", isActive: true, sortOrder: 4 },
  { id: "home-people", slug: "people", title: "Professionals", content: "", isActive: true, sortOrder: 5 },
  { id: "home-capability", slug: "capability", title: "Capability Map", content: "", isActive: true, sortOrder: 6 },
  { id: "home-case", slug: "case", title: "Case Preview", content: "", isActive: true, sortOrder: 7 },
  { id: "home-contact", slug: "contact", title: "Contact CTA", content: "", isActive: true, sortOrder: 8 },
];

export const defaultSettings: Record<string, string> = {
  home_headline: "Growth.|Experience.|Engineering.",
  home_subtitle: "Strategy, craft and technology organized as one adaptive capability layer.",
  home_primary_cta: "Start a project",
  home_primary_cta_url: "#contact",
  home_secondary_cta: "Explore the system",
  home_secondary_cta_url: "#work",
  home_eyebrow: "Independent digital collective",
  start_offer_title: "Transformamos ideias em software.",
  start_starting_price: "A partir de R$ 199",
  start_primary_cta: "Iniciar projeto",
  company_name: "RRV.digital",
  commercial_email: "hello@rrv.digital",
  whatsapp: "",
  default_cta: "Start a project",
  social_links: "{}",
  footer_info: "© 2026 RRV.digital",
};

export const defaultProjects: PublicProject[] = [
  { id: "signal", slug: "signal-growth-engine", title: "Signal / Growth Engine", description: "Paid Media · Analytics · Acquisition", imageUrl: "/work/growth.png", projectUrl: "#case-preview", category: "growth", technologies: "Paid Media, Analytics, Acquisition", featured: true, sortOrder: 1 },
  { id: "arc", slug: "arc-product-experience", title: "Arc / Product Experience", description: "Product Design · UX · Systems", imageUrl: "/work/experience.png", projectUrl: "#case-preview", category: "experience", technologies: "Product Design, UX, Systems", featured: true, sortOrder: 2 },
  { id: "core", slug: "core-execution-layer", title: "Core / Execution Layer", description: "AI · Web3 · Architecture", imageUrl: "/work/engineering.png", projectUrl: "#case-preview", category: "engineering", technologies: "AI, Web3, Architecture", featured: true, sortOrder: 3 },
];

const capabilityNames = {
  growth: ["Paid Media Strategy", "Performance Creative", "Acquisition Systems", "Growth Audit", "CRO & Experimentation", "Analytics Architecture", "Attribution Strategy", "Lifecycle Marketing", "SEO Growth Systems", "Marketing Automation", "Funnel Strategy", "Growth Intelligence"],
  experience: ["UX Audit", "Product Design", "UX/UI Design", "Design Systems", "Interaction Design", "Frontend Experience", "Product Discovery", "User Research", "Prototyping", "Accessibility Review", "Interface Motion", "Experience Optimization"],
  engineering: ["Smart Contract Architecture", "Fullstack Engineering", "AI Solutions", "Web3 Infrastructure", "Solution Architecture", "DevOps Systems", "API Architecture", "Cloud Engineering", "Automation Engineering", "Technical Discovery", "Security by Design", "Performance Engineering"],
} as const;

export const defaultServices: PublicService[] = Object.entries(capabilityNames).flatMap(([category, names]) =>
  names.map((name, index) => ({ id: `${category}-${index}`, slug: `${category}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, name, description: "", category: category as PublicService["category"], icon: "", cta: "Start a project", sortOrder: index + 1 })),
);

export const defaultTeam: PublicTeamMember[] = [
  { id: "p01", slug: "growth-strategy", name: "Growth Strategy", role: "Growth Strategy", biography: "Acquisition · Media · Analytics", imageUrl: "", linkedinUrl: "", discipline: "growth", sortOrder: 1 },
  { id: "p02", slug: "performance-systems", name: "Performance Systems", role: "Performance Systems", biography: "Creative · CRO · Attribution", imageUrl: "", linkedinUrl: "", discipline: "growth", sortOrder: 2 },
  { id: "p03", slug: "product-experience", name: "Product Experience", role: "Product Experience", biography: "UX/UI · Interaction · Research", imageUrl: "", linkedinUrl: "", discipline: "experience", sortOrder: 3 },
  { id: "p04", slug: "design-systems", name: "Design Systems", role: "Design Systems", biography: "Systems · Frontend · Motion", imageUrl: "", linkedinUrl: "", discipline: "experience", sortOrder: 4 },
  { id: "p05", slug: "solution-engineering", name: "Solution Engineering", role: "Solution Engineering", biography: "Fullstack · AI · Architecture", imageUrl: "", linkedinUrl: "", discipline: "engineering", sortOrder: 5 },
  { id: "p06", slug: "decentralized-systems", name: "Decentralized Systems", role: "Decentralized Systems", biography: "Web3 · Smart Contracts · DevOps", imageUrl: "", linkedinUrl: "", discipline: "engineering", sortOrder: 6 },
];

export const defaultCtas: PublicCta[] = [
  { id: "cta-neutral", slug: "neutral", title: "Bring the problem.", label: "Start a project", url: "mailto:hello@rrv.digital", context: "neutral", sortOrder: 1 },
  { id: "cta-growth", slug: "growth", title: "Ready to create momentum?", label: "Start a Growth Project", url: "mailto:hello@rrv.digital", context: "growth", sortOrder: 2 },
  { id: "cta-experience", slug: "experience", title: "Make the experience unmistakable.", label: "Design the Experience", url: "mailto:hello@rrv.digital", context: "experience", sortOrder: 3 },
  { id: "cta-engineering", slug: "engineering", title: "Build the system behind the idea.", label: "Discuss Architecture", url: "mailto:hello@rrv.digital", context: "engineering", sortOrder: 4 },
  { id: "cta-convergence", slug: "convergence", title: "Complex problems need more than one discipline.", label: "Build with RRV", url: "mailto:hello@rrv.digital", context: "convergence", sortOrder: 5 },
];
