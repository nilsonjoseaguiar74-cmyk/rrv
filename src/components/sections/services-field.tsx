import { LineIcon } from "@/components/ui/line-icon";
import { content } from "@/lib/content";

export function ServicesField() {
  const disciplines = content.disciplines();
  const services = content.services();

  return <section id="services" aria-labelledby="services-title">
    <header className="services-intro section-pad">
      <p className="section-index">02 <span>Adaptive services</span></p>
      <div><h2 id="services-title">36 ways in.<br /><em>One system out.</em></h2><p>Explore verticalmente. Cada capacidade mantém seu próprio caminho para uma conversa.</p></div>
    </header>
    <div className="service-field">
      {disciplines.map((discipline) => {
        const domainServices = services.filter((service) => service.disciplineId === discipline.id);
        return <section className={`service-domain service-domain--${discipline.slug}`} data-context={discipline.slug} key={discipline.id} aria-labelledby={`domain-${discipline.id}`}>
          <header className="service-domain__head"><span>{discipline.shortName}</span><LineIcon name={discipline.slug === "growth" ? "trend" : discipline.slug === "experience" ? "frame" : "hex"} /><h3 id={`domain-${discipline.id}`}>{discipline.name}</h3><p>{domainServices.length} capacidades</p></header>
          <ol className="service-list">
            {domainServices.map((service, index) => <li key={service.id}>
              <a className="service-row focus-ring" href={service.ctaUrl} target={service.ctaTarget} rel={service.ctaTarget === "_blank" ? "noreferrer" : undefined}>
                <span>{String(index + 1).padStart(2, "0")}</span><strong>{service.name}</strong><small>{service.ctaLabel}</small><span aria-hidden="true">→</span>
              </a>
            </li>)}
          </ol>
        </section>;
      })}
    </div>
  </section>;
}
