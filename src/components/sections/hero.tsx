import { content } from "@/lib/content";

export function Hero() {
  const disciplines = content.disciplines();

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero__meta"><span>Independent digital collective</span><span>São Paulo · Brazil / Worldwide</span></div>
      <h1 className="hero__statement" id="hero-title" aria-label={`${disciplines.map((item) => item.name).join(". ")}. One digital system.`}>
        {disciplines.map((discipline) => <span className="hero__line" key={discipline.id} data-context={discipline.slug}>{discipline.name}.</span>)}
      </h1>
      <div className="hero__footer"><p>One digital system.</p><p>Strategy, craft and technology organized as one adaptive capability layer.</p><span>Contexto adaptativo</span></div>
      <div className="hero__trace" aria-hidden="true"><span /><span /><span /></div>
    </section>
  );
}
