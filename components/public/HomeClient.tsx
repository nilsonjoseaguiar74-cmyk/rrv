"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RRVLogo } from "@/components/brand/RRVLogo";
import type { PublicSiteData } from "@/lib/cms/server";

type Mode = "neutral" | "growth" | "experience" | "engineering" | "convergence";


function Arrow() {
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
}

function DomainIcon({ mode }: { mode: "growth" | "experience" | "engineering" }) {
  const paths = {
    growth: <><path d="M4 19V5m0 14h16"/><path d="m7 15 4-4 3 2 6-7"/></>,
    experience: <><path d="M5 6c4-3 10-3 14 0v12c-4 3-10 3-14 0Z"/><path d="M8 9c3 2 5 2 8 0M8 15c3-2 5-2 8 0"/></>,
    engineering: <><path d="M8 4h8l4 4v8l-4 4H8l-4-4V8Z"/><path d="M9 9h6v6H9z"/></>,
  };
  return <svg className="domain-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[mode]}</svg>;
}

function ServiceDomain({ mode, index, items }: { mode: "growth" | "experience" | "engineering"; index: string; items: PublicSiteData["services"] }) {
  return (
    <section className={`service-domain service-domain-${mode}`} data-mode={mode}>
      <div className="service-domain-head"><span>{index}</span><DomainIcon mode={mode}/><h3>{mode}</h3><span>{items.length} capabilities</span></div>
      <div className="service-list">
        {items.map((service, i) => (
          <a href="#contact" className="service-row" key={service.id}>
            <span>{String(i + 1).padStart(2,"0")}</span><strong>{service.name}</strong><small>{service.cta}</small><Arrow />
          </a>
        ))}
      </div>
    </section>
  );
}

export default function HomeClient({ content }: { content: PublicSiteData }) {
  const [liveContent, setLiveContent] = useState(content);
  content = liveContent;
  const [mode, setMode] = useState<Mode>("neutral");
  const projects = content.projects.slice(0, 6);
  const services = {
    growth: content.services.filter((item) => item.category === "growth"),
    experience: content.services.filter((item) => item.category === "experience"),
    engineering: content.services.filter((item) => item.category === "engineering"),
  };
  const headline = (content.settings.home_headline || "Growth.|Experience.|Engineering.").split("|");
  const sectionMap = Object.fromEntries(content.homeSections.map((section) => [section.slug, section]));
  const sectionStyle = (slug: string) => ({ order: Number(sectionMap[slug]?.sortOrder || 0) + 10, display: sectionMap[slug]?.isActive === false ? "none" : undefined });

  useEffect(() => {
    Promise.all([
      fetch("/api/public/home", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()),
      fetch("/api/public/projects", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()),
      fetch("/api/public/services", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()),
      fetch("/api/public/team", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()),
    ]).then(([home, projectsResponse, servicesResponse, teamResponse]) => setLiveContent((current) => ({ ...current, ...home, projects: projectsResponse.items || home.projects || current.projects, services: servicesResponse.items || home.services || current.services, team: teamResponse.items || home.team || current.team, ctas: home.ctas || current.ctas }))).catch(() => undefined);
  }, []);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-mode]"));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setMode((visible[0].target as HTMLElement).dataset.mode as Mode);
    }, { rootMargin: "-30% 0px -45%", threshold: [0, .2, .5, .8] });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const defaultContextCta: Record<Mode, [string, string, string]> = {
    neutral: ["Bring the problem.", "Start a project", "mailto:hello@rrv.digital"],
    growth: ["Ready to create momentum?", "Start a Growth Project", "mailto:hello@rrv.digital"],
    experience: ["Make the experience unmistakable.", "Design the Experience", "mailto:hello@rrv.digital"],
    engineering: ["Build the system behind the idea.", "Discuss Architecture", "mailto:hello@rrv.digital"],
    convergence: ["Complex problems need more than one discipline.", "Build with RRV", "mailto:hello@rrv.digital"],
  };
  const contextCta = { ...defaultContextCta };
  for (const cta of content.ctas) contextCta[cta.context as Mode] = [cta.title, cta.label, cta.url];

  return (
    <main className={`site mode-${mode}`}>
      <header className="header">
        <a className="brand" href="#top"><RRVLogo variant="monochrome" /></a>
        <nav aria-label="Primary"><a href="#work">Work</a><a href="#services">Expertise</a><a href="#people">People</a><Link href="/admin/login">Admin</Link><Link className="home-start-link" href="/start">Start ↗</Link></nav>
        <div className="header-cta">
<a className="home-start-mobile" href="/start">Start ↗</a><a href={content.settings.home_primary_cta_url || "#contact"}>{content.settings.home_primary_cta || "Start a project"} <Arrow /></a></div>
      </header>

      <section id="top" className="hero" data-mode="neutral" style={sectionStyle("hero")}>
        <div className="hero-kicker"><span>{content.settings.home_eyebrow}</span><span>Florianópolis - SC - Brasil</span></div>
        <div className="hero-title" aria-label="Growth. Experience. Engineering. One digital system.">
          {headline.map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}
        </div>
        <div className="hero-bottom">
          <p>One digital system.</p>
          <p>{content.settings.home_subtitle}</p>
          <div className="context-readout"><i /><span>Context / {mode}</span></div>
        </div>
        <div className="hero-trace" aria-hidden="true"><span /><span /><span /></div>
      </section>

      <section id="work" className="work-intro section-pad" data-mode="convergence" style={sectionStyle("work")}>
        <div className="section-index"><span>01</span><span>Selected work</span></div>
        <div><h2>Proof over<br/>promise.</h2><p>Projects are not sorted into silos. Their relevance changes with the capability you are exploring.</p></div>
      </section>

      <section className="project-sequence" aria-label="Selected projects" style={sectionStyle("work")}>
        <div className="project-priority" aria-label="Adaptive project priority">
          {projects.map((project, index) => <span className={mode === project.category ? "is-priority" : ""} key={project.id}><b>{String(index + 1).padStart(2,"0")}</b>{project.title}</span>)}
        </div>
        {projects.map((project, index) => (
          <article className={`project project-${project.category}`} data-mode={project.category} key={project.id}>
            <div className="project-head"><span>{String(index + 1).padStart(2,"0")}</span><span>{project.technologies || project.description}</span><span>Selected case</span></div>
            <div className="project-frame"><img src={project.imageUrl} alt="" /><div className="project-scan" /></div>
            <div className="project-foot"><h3>{project.title}</h3><a href={project.projectUrl || "#case-preview"}>View project <Arrow /></a></div>
          </article>
        ))}
      </section>

      <section id="services" className="services-intro section-pad" data-mode="neutral" style={sectionStyle("services")}>
        <div className="section-index"><span>02</span><span>Adaptive services</span></div>
        <div className="services-title"><h2>36 ways in.<br/><em>One system out.</em></h2><p>Explore vertically. The interface follows the field you spend time in; each capability keeps its own path to conversation.</p></div>
      </section>
      <div className="service-field" style={sectionStyle("services")}>
        <ServiceDomain mode="growth" index="G" items={services.growth} />
        <ServiceDomain mode="experience" index="X" items={services.experience} />
        <ServiceDomain mode="engineering" index="E" items={services.engineering} />
      </div>

      <section id="disciplines" className="disciplines section-pad" data-mode="convergence" style={sectionStyle("disciplines")}>
        <div className="section-index"><span>03</span><span>Disciplines</span></div>
        <div className="discipline-statement">
          <p>Not departments.</p><h2>Three lenses.<br/>One operating model.</h2>
          <div className="discipline-lines">
            <span><b>G</b> Create demand and measurable momentum.</span>
            <span><b>X</b> Turn complexity into usable experience.</span>
            <span><b>E</b> Engineer durable systems behind the interface.</span>
          </div>
        </div>
      </section>

      <section id="people" className="people section-pad" data-mode="neutral" style={sectionStyle("people")}>
        <div className="section-index"><span>04</span><span>Professionals</span></div>
        <div className="people-head"><h2>Capability<br/>is plural.</h2><p>The roster is designed to expand. Experts connect through shared knowledge and project context instead of fixed team cards.</p></div>
        <div className="people-roster">
          {content.team.map((person, index) => <div className={`person-line person-${person.discipline}`} key={person.id}><span>P.{String(index + 1).padStart(2,"0")}</span><strong>{person.role}</strong><span>{person.biography}</span><i /></div>)}
          <div className="roster-tail"><span>System capacity</span><span>Expandable / multi-expert by discipline</span></div>
        </div>
      </section>

      <section className="capability section-pad" data-mode="convergence" style={sectionStyle("capability")}>
        <div className="section-index"><span>05</span><span>Capability map</span></div>
        <div className="capability-layout">
          <div><h2>Knowledge<br/>moves through<br/>the work.</h2><p>A lightweight relationship model connects who knows, what they know, where it has been applied and how it can be engaged.</p></div>
          <div className="map-wrap" aria-label="Professional connects to Knowledge, Project and Service">
            <svg viewBox="0 0 700 430" role="img">
              <path className="map-path" d="M90 215 C175 70 260 70 350 215 S525 360 610 215" />
              <path className="map-path faint" d="M90 215 C205 340 265 330 350 215 S515 85 610 215" />
              <circle cx="90" cy="215" r="8"/><circle cx="265" cy="145" r="8"/><circle cx="435" cy="285" r="8"/><circle cx="610" cy="215" r="8"/>
            </svg>
            <span className="map-label l1"><b>01</b>Professional</span><span className="map-label l2"><b>02</b>Knowledge</span><span className="map-label l3"><b>03</b>Project</span><span className="map-label l4"><b>04</b>Service</span>
          </div>
        </div>
      </section>

      <section id="case-preview" className="case-preview" data-mode="convergence" style={sectionStyle("case")}>
        <div className="case-image"><img src="/work/engineering.png" alt=""/><div className="case-inset"><img src="/work/growth.png" alt=""/></div></div>
        <div className="case-copy">
          <div className="section-index"><span>06</span><span>Case preview / Convergence</span></div>
          <h2>When growth<br/>needs an engine.</h2>
          <p>A campaign can expose a product problem. A product problem can expose an architecture problem. RRV follows the dependency instead of handing it off between silos.</p>
          <dl><div><dt>Signal</dt><dd>Acquisition constraint</dd></div><div><dt>Response</dt><dd>Experience redesign</dd></div><div><dt>System</dt><dd>Technical enablement</dd></div></dl>
          <a href="#contact">Read the full case logic <Arrow /></a>
        </div>
      </section>

      <section id="contact" className="contact section-pad" style={sectionStyle("contact")}>
        <div className="contact-context"><span>Current context</span><i/><span>{mode}</span></div>
        <p>{contextCta[mode][0]}</p>
        <a href={contextCta[mode][2]}><span>{contextCta[mode][1]}</span><Arrow /></a>
      </section>

      <footer style={{ order: 999 }}>
        <div className="footer-mark"><RRVLogo variant="monochrome"/><span>Growth. Experience. Engineering.</span></div>
        <div><span>RRV.digital</span><span>Independent digital collective</span><Link href="/admin/login">Admin system →</Link></div>
        <div><a href="#top">Back to top <Arrow /></a><span>© 2026 RRV.digital</span></div>
      </footer>
    </main>
  );
}
