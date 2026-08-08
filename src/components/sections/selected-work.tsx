"use client";

import Image from "next/image";
import { useAdaptiveContext } from "@/components/context/adaptive-context";
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
    <section className="work" id="work" aria-labelledby="work-title">
      <header className="work-intro section-pad"><p className="section-index">01 <span>Selected work</span></p><div><h2 id="work-title">Proof over<br />promise.</h2><p>Projetos não vivem em silos. A relevância muda conforme a capacidade que você explora.</p></div></header>
      <div className="project-priority" aria-label="Prioridade adaptativa dos projetos">{projects.map((project, index) => <span key={project.id} className={index === 0 ? "is-priority" : ""}><b>{String(index + 1).padStart(2, "0")}</b>{project.title}</span>)}</div>
      <div className="project-list" aria-label="Projetos selecionados">
        {projects.map((project, index) => {
          const projectDisciplines = content.disciplinesByIds(project.disciplineIds);
          const projectKnowledge = content.knowledgeByIds(project.knowledgeIds);
          const projectProfessionals = content.professionalsByIds(project.professionalIds);
          const projectContext = projectDisciplines.length > 1 ? "convergence" : projectDisciplines[0]?.slug;
          return (
            <article className="project" key={project.id} data-context={projectContext === "convergence" ? undefined : projectContext}>
              <div className="project__head"><span>{String(index + 1).padStart(2, "0")}</span><span>{projectKnowledge.slice(0, 3).map((item) => item.name).join(" · ")}</span><span>{project.year} · {statusLabels[project.status]}</span></div>
              <div className="project__visual"><Image src={project.cover.src} alt={project.cover.alt} fill sizes="100vw" priority={index === 0} /><span className="project__scan" /></div>
              <div className="project__foot"><h3>{project.title}</h3><p>{project.shortDescription}</p><a className="focus-ring" href="#case-preview">Ver projeto →</a></div>
              <span className="sr-only">{projectDisciplines.map((item) => item.name).join(", ")} — {projectProfessionals.map((item) => item.name).join(", ")}</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
