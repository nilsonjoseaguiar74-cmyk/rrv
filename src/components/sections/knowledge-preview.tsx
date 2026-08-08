import { LineIcon } from "@/components/ui/line-icon";
import { SectionHeading } from "@/components/ui/section-heading";
import { content } from "@/lib/content";

const iconByKnowledge: Record<string, string> = { growth: "trend", design: "frame", engineering: "nodes", strategy: "compass" };

export function KnowledgePreview() {
  const items = content.featuredKnowledge();
  const professionals = content.featuredProfessionals();
  const projects = content.featuredProjects();
  const services = content.services();
  return (
    <section className="section capability" id="capabilities" aria-labelledby="capability-title">
      <SectionHeading id="capability-title" eyebrow="05 / Capability map" title="Conhecimento existe entre coisas." description="Uma leitura leve das relações que sustentam cada capacidade — pessoas, evidências e serviços conectados por IDs." inverse />
      <div className="capability-map">
        <div className="capability-map__axis" aria-hidden="true"><span>Professional</span><span>Knowledge</span><span>Project</span><span>Service</span></div>
        {items.map((item, index) => {
          const relatedProfessionals = professionals.filter((professional) => professional.knowledgeIds.includes(item.id));
          const relatedProjects = projects.filter((project) => project.knowledgeIds.includes(item.id));
          const relatedServices = services.filter((service) => service.knowledgeIds.includes(item.id));
          return <article key={item.id} className="capability-row">
            <div className="capability-row__people">{relatedProfessionals.map((person) => <span key={person.id}>{person.name.split(" ")[0]}</span>)}</div>
            <div className="capability-row__knowledge"><span>{String(index + 1).padStart(2, "0")}</span><LineIcon name={iconByKnowledge[item.category]} /><h3>{item.name}</h3><p>{item.description}</p></div>
            <div className="capability-row__projects">{relatedProjects.map((project) => <span key={project.id}>{project.title}</span>)}</div>
            <div className="capability-row__services"><strong>{relatedServices.length}</strong><span>serviços conectados</span></div>
          </article>;
        })}
      </div>
    </section>
  );
}
