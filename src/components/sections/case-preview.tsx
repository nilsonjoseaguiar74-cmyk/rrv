import Image from "next/image";
import { content } from "@/lib/content";

export function CasePreview() {
  const project = content.featuredProjects()[0];
  return <section className="case-preview" aria-labelledby="case-title">
    <div className="case-preview__visual"><Image src={project.cover.src} alt={project.cover.alt} width={project.cover.width} height={project.cover.height} sizes="(max-width: 800px) 100vw, 50vw" /></div>
    <div className="case-preview__story"><p className="eyebrow">06 / Case anatomy</p><span>{project.subtitle} · {project.year}</span><h2 id="case-title">{project.title}</h2><p>{project.description}</p><dl><div><dt>Challenge</dt><dd>{project.challenge}</dd></div><div><dt>Response</dt><dd>{project.solution}</dd></div><div><dt>Result</dt><dd>{project.results}</dd></div></dl><a className="text-link focus-ring" href="#contact">Conversar sobre um projeto semelhante <span aria-hidden="true">↗</span></a></div>
  </section>;
}
