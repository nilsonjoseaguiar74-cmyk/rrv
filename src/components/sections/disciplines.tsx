import { SectionHeading } from "@/components/ui/section-heading";
import { content } from "@/lib/content";

export function Disciplines() {
  const disciplines = content.disciplines();
  return (
    <section className="section disciplines" id="disciplines" aria-labelledby="disciplines-title">
      <SectionHeading id="disciplines-title" eyebrow="03 / Disciplines" title="Especialidades distintas. Direção compartilhada." />
      <ol className="discipline-list">
        {disciplines.map((discipline, index) => (
          <li key={discipline.id} data-context={discipline.slug} style={{ "--accent": discipline.accent } as React.CSSProperties}>
            <span>0{index + 1}</span><h3>{discipline.name}</h3><p>{discipline.description}</p><i aria-hidden="true">{discipline.shortName}</i>
          </li>
        ))}
      </ol>
    </section>
  );
}
