import { content } from "@/lib/content";

export function KnowledgePreview() {
  const knowledge = content.featuredKnowledge();
  const professionals = content.featuredProfessionals();
  const projects = content.featuredProjects();
  const services = content.services();
  return <section className="capability section-pad" id="capabilities" aria-labelledby="capability-title">
    <p className="section-index">05 <span>Capability map</span></p>
    <div className="capability__layout"><div><h2 id="capability-title">Knowledge<br />moves through<br />the work.</h2><p>Quem sabe, o que sabe, onde foi aplicado e como contratar — relações reais derivadas por IDs.</p></div>
      <div className="map-wrap" aria-label="Professional conecta-se a Knowledge, Project e Service">
        <svg viewBox="0 0 700 430" role="img" aria-labelledby="map-title"><title id="map-title">Mapa relacional das capacidades</title><path d="M70 220 C175 55 260 75 350 215 S525 365 630 215" /><path className="faint" d="M70 220 C205 350 265 330 350 215 S515 75 630 215" />{[70, 265, 435, 630].map((x, index) => <circle key={x} cx={x} cy={[220, 145, 285, 215][index]} r="8" />)}</svg>
        {[
          ["01", "Professional", `${professionals.length} experts`],
          ["02", "Knowledge", `${knowledge.length} fields`],
          ["03", "Project", `${projects.length} cases`],
          ["04", "Service", `${services.length} paths`],
        ].map(([number, label, count], index) => <span className={`map-label l${index + 1}`} key={label}><b>{number}</b>{label}<small>{count}</small></span>)}
      </div>
    </div>
  </section>;
}
