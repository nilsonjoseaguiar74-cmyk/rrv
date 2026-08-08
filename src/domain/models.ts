export type EntityId = string;

export type MediaType = "image" | "video";

export interface Media {
  id: EntityId;
  type: MediaType;
  src: string;
  alt: string;
  width: number;
  height: number;
  poster?: string;
  caption?: string;
}

export type SocialPlatform = "linkedin" | "github" | "website" | "instagram";

export interface SocialLink {
  platform: SocialPlatform;
  label: string;
  href: string;
}

export interface Professional {
  id: EntityId;
  slug: string;
  name: string;
  title: string;
  shortBio: string;
  fullBio: string;
  portrait: Media;
  disciplineIds: EntityId[];
  knowledgeIds: EntityId[];
  socialLinks: SocialLink[];
  featured: boolean;
  active: boolean;
  displayOrder: number;
}

export type ProjectStatus = "concept" | "in-progress" | "launched";

export interface Project {
  id: EntityId;
  slug: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  challenge: string;
  solution: string;
  results: string;
  cover: Media;
  media: Media[];
  professionalIds: EntityId[];
  knowledgeIds: EntityId[];
  disciplineIds: EntityId[];
  year: number;
  status: ProjectStatus;
  featured: boolean;
  published: boolean;
  displayOrder: number;
}

export type KnowledgeCategory =
  | "growth"
  | "design"
  | "engineering"
  | "strategy";

export interface Knowledge {
  id: EntityId;
  slug: string;
  name: string;
  category: KnowledgeCategory;
  description: string;
  icon: string;
  featured: boolean;
  active: boolean;
  displayOrder: number;
}

export interface Discipline {
  id: EntityId;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  accent: string;
  displayOrder: number;
}

export type AdaptiveContext = "neutral" | "growth" | "experience" | "engineering" | "convergence";
export type ContextDiscipline = Exclude<AdaptiveContext, "neutral" | "convergence">;
export type CtaTarget = "_self" | "_blank";
export type ServiceVisualVariant = "signal" | "editorial" | "technical" | "system";

export interface Service {
  id: EntityId;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  disciplineId: EntityId;
  expertIds: EntityId[];
  knowledgeIds: EntityId[];
  relatedProjectIds: EntityId[];
  icon: string;
  visualVariant: ServiceVisualVariant;
  ctaLabel: string;
  ctaUrl: string;
  ctaTarget: CtaTarget;
  featured: boolean;
  active: boolean;
  displayOrder: number;
}
