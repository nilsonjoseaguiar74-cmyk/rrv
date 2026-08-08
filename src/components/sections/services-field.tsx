"use client";

import { useState } from "react";
import { useAdaptiveContext } from "@/components/context/adaptive-context";
import { LineIcon } from "@/components/ui/line-icon";
import { SectionHeading } from "@/components/ui/section-heading";
import { content } from "@/lib/content";

const disciplineByContext = { growth: "discipline-growth", experience: "discipline-experience", engineering: "discipline-engineering" } as const;

export function ServicesField() {
  const { context } = useAdaptiveContext();
  const [expanded, setExpanded] = useState(false);
  const activeDiscipline = context in disciplineByContext ? disciplineByContext[context as keyof typeof disciplineByContext] : null;
  const services = content.services().sort((a, b) => Number(b.disciplineId === activeDiscipline) - Number(a.disciplineId === activeDiscipline) || a.displayOrder - b.displayOrder);
  const visible = expanded ? services : services.slice(0, 12);

  return (
    <section className="section services" id="services" aria-labelledby="services-title">
      <SectionHeading id="services-title" eyebrow="02 / Service field" title="36 modos de construir valor." description="Um índice editorial vivo: o contexto aproxima capacidades relevantes sem transformar o portfólio em três sites." />
      <div className="services__legend" aria-live="polite"><span>Contexto atual</span><strong>{context}</strong><span>{visible.length} de {services.length} serviços</span></div>
      <ol className="service-index">
        {visible.map((service) => {
          const discipline = content.disciplinesByIds([service.disciplineId])[0];
          return <li key={service.id} data-context={discipline.slug} data-variant={service.visualVariant}>
            <span className="service-index__number">{String(service.displayOrder).padStart(2, "0")}</span>
            <LineIcon name={service.icon} size={26} />
            <div><p>{discipline.name}</p><h3>{service.name}</h3><span>{service.shortDescription}</span></div>
            <a className="service-index__cta focus-ring" href={service.ctaUrl} target={service.ctaTarget} rel={service.ctaTarget === "_blank" ? "noreferrer" : undefined} aria-label={`${service.ctaLabel}: ${service.shortDescription}`}>{service.ctaLabel}<span aria-hidden="true">↗</span></a>
          </li>;
        })}
      </ol>
      <button className="index-toggle focus-ring" type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>{expanded ? "Mostrar seleção contextual" : `Ver todos os ${services.length} serviços`}</button>
    </section>
  );
}
