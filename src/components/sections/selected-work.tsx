"use client";

import Image from "next/image";
import { useAdaptiveContext } from "@/components/context/adaptive-context";
import { SectionHeading } from "@/components/ui/section-heading";
import { content } from "@/lib/content";

const statusLabels = { concept: "Conceito", "in-progress": "Em curso", launched: "Lançado" } as const;
const disciplineByContext = { growth: "discipline-growth", experience: "discipline-experience", engineering: "discipline-engineering" } as const;

export function SelectedWork() {
  const { context } = useAdaptiveContext();
  const projects = content.featuredProjects().sort((a, b) => {
    if (!(context in disciplineByContext)) return a.displayOrder - b.displayOrder;
    const disciplineId = disciplineByContext[context as keyof typeof disciplineByContext];
    return Number(b.disciplineIds.includes(disciplineId)) - Number(a.disciplineIds.includes(disciplineId)) || a.displayOrder - b.displayOrder;
  });

  return (
    <section className="section work" id="work" aria-labelledby="work-title">
      <SectionHeading id="work-title" eyebrow="01 / Selected work" title="Sistemas construídos para mover negócios." description="A seleção permanece inteira; sua sequência responde ao contexto que ganha relevância." />
      <div className="project-list">
        {projects.map((project, index) => {
          const projectDisciplines = content.disciplinesByIds(project.disciplineIds);
          const projectKnowledge = content.knowledgeByIds(project.knowledgeIds);
          const projectProfessionals = content.professionalsByIds(project.professionalIds);
          const projectContext = projectDisciplines.length > 1 ? "convergence" : projectDisciplines[0]?.slug;
          return (
            <article className="project" key={project.id} data-context={projectContext === "convergence" ? undefined : projectContext}>
              <div className="project__visual"><Image src={project.cover.src} alt={project.cover.alt} width={project.cover.width} height={project.cover.height} sizes="(max-width: 760px) 100vw, 58vw" priority={index === 0} /><span>{String(index + 1).padStart(2, "0")}</span></div>
              <div className="project__content">
                <div className="project__meta"><span>{project.year}</span><span>{statusLabels[project.status]}</span></div>
                <p className="project__subtitle">{project.subtitle}</p><h3>{project.title}</h3><p className="project__description">{project.shortDescription}</p>
                <dl className="project__relations"><div><dt>Disciplinas</dt><dd>{projectDisciplines.map((item) => item.name).join(" · ")}</dd></div><div><dt>Capacidades</dt><dd>{projectKnowledge.slice(0, 3).map((item) => item.name).join(" · ")}</dd></div><div><dt>Equipe</dt><dd>{projectProfessionals.map((item) => item.name.split(" ")[0]).join(" · ")}</dd></div></dl>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
