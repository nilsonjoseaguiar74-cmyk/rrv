import { content } from "@/lib/content";

export function Disciplines() {
  const disciplines = content.disciplines();
  return <section className="disciplines section-pad" id="disciplines" aria-labelledby="disciplines-title">
    <p className="section-index">03 <span>Disciplines</span></p>
    <div className="discipline-statement"><p>Not departments.</p><h2 id="disciplines-title">Three lenses.<br />One operating model.</h2>
      <ol className="discipline-lines">{disciplines.map((discipline) => <li key={discipline.id} data-context={discipline.slug}><b>{discipline.shortName}</b><span>{discipline.description}</span></li>)}</ol>
    </div>
  </section>;
}
