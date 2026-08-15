import { disciplines, knowledge, professionals, projects, services } from "@/data";
import type { Discipline, EntityId, Knowledge, Professional, Project, Service } from "@/domain/models";

const byOrder = <T extends { displayOrder: number }>(items: readonly T[]) =>
  [...items].sort((a, b) => a.displayOrder - b.displayOrder);

const selectByIds = <T extends { id: EntityId }>(items: readonly T[], ids: EntityId[]) => {
  const index = new Map(items.map((item) => [item.id, item]));
  return ids.flatMap((id) => {
    const item = index.get(id);
    return item ? [item] : [];
  });
};

export const content = {
  disciplines: () => byOrder(disciplines),
  featuredProjects: () => byOrder(projects.filter((project) => project.featured && project.published)),
  featuredProfessionals: () => byOrder(professionals.filter((professional) => professional.featured && professional.active)),
  featuredKnowledge: () => byOrder(knowledge.filter((item) => item.featured && item.active)),
  knowledge: () => byOrder(knowledge.filter((item) => item.active)),
  services: () => byOrder(services.filter((service) => service.active)),
  disciplinesByIds: (ids: EntityId[]): Discipline[] => selectByIds(disciplines, ids),
  knowledgeByIds: (ids: EntityId[]): Knowledge[] => selectByIds(knowledge, ids),
  professionalsByIds: (ids: EntityId[]): Professional[] => selectByIds(professionals, ids),
  projectsByIds: (ids: EntityId[]): Project[] => selectByIds(projects, ids),
  servicesByIds: (ids: EntityId[]): Service[] => selectByIds(services, ids),
};
