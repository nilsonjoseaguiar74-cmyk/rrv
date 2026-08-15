import Image from "next/image";
import { content } from "@/lib/content";

export function CasePreview() {
  const projects = content.featuredProjects();
  const project = projects[0];
  const secondary = projects[2] ?? projects[1] ?? project;
  return <section className="case-preview" id="case-preview" aria-labelledby="case-title">
    <div className="case-preview__visual"><Image src={secondary.cover.src} alt={secondary.cover.alt} fill sizes="(max-width: 760px) 100vw, 60vw" /><div><Image src={project.cover.src} alt={project.cover.alt} fill sizes="35vw" /></div></div>
    <div className="case-preview__story"><p className="section-index">06 <span>Case preview / Convergence</span></p><h2 id="case-title">When growth<br />needs an engine.</h2><p>{project.description} RRV acompanha a dependência em vez de repassá-la entre silos.</p><dl><div><dt>Signal</dt><dd>{project.challenge}</dd></div><div><dt>Response</dt><dd>{project.solution}</dd></div><div><dt>System</dt><dd>{project.results}</dd></div></dl><a className="focus-ring" href="#contact">Explorar a lógica completa →</a></div>
  </section>;
}
