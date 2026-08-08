"use client";

import Image from "next/image";
import { useAdaptiveContext } from "@/components/context/adaptive-context";
import { SectionHeading } from "@/components/ui/section-heading";
import { content } from "@/lib/content";

const disciplineByContext = { growth: "discipline-growth", experience: "discipline-experience", engineering: "discipline-engineering" } as const;

export function Professionals() {
  const { context } = useAdaptiveContext();
  const activeDiscipline = context in disciplineByContext ? disciplineByContext[context as keyof typeof disciplineByContext] : null;
  const professionals = content.featuredProfessionals().sort((a, b) => Number(b.disciplineIds.includes(activeDiscipline ?? "")) - Number(a.disciplineIds.includes(activeDiscipline ?? "")) || a.displayOrder - b.displayOrder);
  return (
    <section className="section people" id="people" aria-labelledby="people-title">
      <SectionHeading id="people-title" eyebrow="04 / Professionals" title="Pensamento sênior, colaboração direta." description="Uma rede preparada para crescer por competência, não por uma grade fixa de cargos." />
      <div className="people-grid">
        {professionals.map((professional) => {
          const professionalDisciplines = content.disciplinesByIds(professional.disciplineIds);
          return <article className="person" key={professional.id} data-context={professionalDisciplines[0]?.slug}>
            <div className="person__portrait"><Image src={professional.portrait.src} alt={professional.portrait.alt} width={professional.portrait.width} height={professional.portrait.height} sizes="(max-width: 640px) 84vw, (max-width: 1000px) 45vw, 31vw" /></div>
            <div className="person__info"><p>{professionalDisciplines.map((item) => item.name).join(" + ")}</p><h3>{professional.name}</h3><span>{professional.title}</span><p>{professional.shortBio}</p><small>{professional.knowledgeIds.length} capacidades · {content.services().filter((service) => service.expertIds.includes(professional.id)).length} serviços</small></div>
          </article>;
        })}
      </div>
    </section>
  );
}
