import { content } from "@/lib/content";

export function Hero() {
  const disciplines = content.disciplines();

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero__meta"><span>Independent digital collective</span><span>BR / Worldwide</span></div>
      <h1 className="hero__statement" id="hero-title">
        {disciplines.map((discipline, index) => (
          <span className="hero__line" key={discipline.id} data-context={discipline.slug} style={{ "--accent": discipline.accent } as React.CSSProperties}>
            <span className="hero__index">0{index + 1}</span>{discipline.name}<span className="hero__dot">.</span>
          </span>
        ))}
      </h1>
      <div className="hero__footer">
        <p>Estratégia, design e tecnologia conectados do primeiro sinal ao produto em escala. A experiência responde ao que você explora.</p>
        <p className="hero__system">One digital system.</p>
      </div>
      <a className="scroll-cue focus-ring" href="#work">Explorar trabalho <span aria-hidden="true">↓</span></a>
    </section>
  );
}
