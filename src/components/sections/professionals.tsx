import { content } from "@/lib/content";

export function Professionals() {
  const professionals = content.featuredProfessionals();
  return <section className="people section-pad" id="people" aria-labelledby="people-title">
    <p className="section-index">04 <span>Professionals</span></p>
    <header className="people__head"><h2 id="people-title">Capability<br />is plural.</h2><p>O roster cresce por competência. Profissionais conectam-se por conhecimento e contexto de projeto, não por cards fixos.</p></header>
    <ol className="people__roster">{professionals.map((professional, index) => {
      const professionalDisciplines = content.disciplinesByIds(professional.disciplineIds);
      const professionalKnowledge = content.knowledgeByIds(professional.knowledgeIds);
      return <li className="person-line" key={professional.id} data-context={professionalDisciplines[0]?.slug}>
        <span>P.{String(index + 1).padStart(2, "0")}</span><strong>{professional.name}</strong><span>{professional.title}</span><span>{professionalKnowledge.map((item) => item.name).join(" · ")}</span><i aria-hidden="true" />
      </li>;
    })}<li className="roster-tail"><span>System capacity</span><span>Expandable / multi-expert by discipline</span></li></ol>
  </section>;
}
