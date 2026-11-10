"use client";

import { RRVLogo } from "@/components/brand/RRVLogo";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

const solutions = [
  ["01", "Sites & Landing Pages", "Páginas profissionais, comerciais e institucionais focadas em presença digital e conversão.", "A partir de R$ 199"],
  ["02", "MVP", "Primeiras versões funcionais para validar uma ideia, produto ou operação.", "Validação rápida"],
  ["03", "Sistemas Web", "Usuários, login, dashboards, painel administrativo, permissões e regras de negócio.", "Produto completo"],
  ["04", "Backend & APIs", "Autenticação, processamento, integrações, armazenamento e regras de negócio.", "Arquitetura sólida"],
  ["05", "Banco de Dados", "PostgreSQL, banco gerenciado, Supabase ou estrutura dedicada conforme o crescimento.", "Dados preparados"],
  ["06", "Automação", "Fluxos digitais para reduzir trabalho manual: entrada, processamento, decisão e ação.", "Operação eficiente"],
  ["07", "Inteligência Artificial", "Atendimento, análise, classificação, documentos, busca inteligente e assistentes.", "IA aplicada"],
  ["08", "VPS & Infraestrutura", "Backend dedicado, banco, APIs, processamento, monitoramento e serviços independentes.", "Pronto para escalar"],
  ["09", "Web3 & Inovação", "Blockchain, wallets, smart contracts, identidade digital e novas soluções tecnológicas.", "Novos modelos"],
] as const;

const evolution = [
  ["START", "Landing page"], ["BUILD", "Sistema + Banco"], ["AUTOMATE", "Integrações + Automação"], ["INTELLIGENCE", "IA"], ["SCALE", "Infraestrutura dedicada"],
] as const;

const plans = [
  { code: "01", name: "START", price: "A partir de R$ 199", copy: "Para páginas comerciais, profissionais, campanhas e validação inicial.", items: ["Landing pages", "Páginas profissionais", "Campanhas", "Validação inicial"], cta: "Começar" },
  { code: "02", name: "BUILD", price: "Orçamento conforme escopo", copy: "Para aplicações que precisam combinar produto, lógica e dados.", items: ["Frontend", "Backend", "Banco", "Autenticação e API"], cta: "Apresentar projeto" },
  { code: "03", name: "SCALE", price: "Infraestrutura sob demanda", copy: "Para projetos que precisam evoluir capacidade, segurança e performance.", items: ["VPS", "Banco dedicado", "Monitoramento", "Otimização"], cta: "Escalar sistema" },
  { code: "04", name: "INNOVATION", price: "Arquitetura personalizada", copy: "Para ideias diferenciadas que exigem novas combinações tecnológicas.", items: ["IA", "Web3", "Blockchain", "Automação avançada"], cta: "Discutir uma ideia" },
] as const;

const steps = [
  ["01", "Ideia", "Você descreve o que precisa, sem linguagem técnica."],
  ["02", "Diagnóstico", "Transformamos a necessidade em requisitos claros."],
  ["03", "MVP", "Definimos a menor versão capaz de gerar valor."],
  ["04", "Desenvolvimento", "Construímos as camadas previstas no escopo."],
  ["05", "Evolução", "Novas funções entram quando a demanda aumenta."],
] as const;

const projectOptions = ["Site", "Landing Page", "Sistema", "Backend", "Banco de dados", "Automação", "Inteligência Artificial", "Integração", "Web3", "Ainda não sei"];
const budgetOptions = ["R$ 199 – R$ 500", "R$ 500 – R$ 1.500", "R$ 1.500 – R$ 5.000", "R$ 5.000+", "Preciso primeiro entender a solução"];

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function MenuIcon({ open }: { open: boolean }) {
  return <span className={`start-menu-icon ${open ? "is-open" : ""}`} aria-hidden="true"><i/><i/></span>;
}

export default function StartClient({ settings }: { settings: Record<string, string> }) {
  const [liveSettings, setLiveSettings] = useState(settings);
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const whatsappHref = useMemo(() => {
    const number = process.env.NEXT_PUBLIC_RRV_WHATSAPP || "";
    const text = encodeURIComponent("Olá, encontrei a RRV.digital e gostaria de conversar sobre um projeto.");
    return `https://wa.me/${number}?text=${text}`;
  }, []);

  useEffect(() => {
    fetch("/api/public/home", { cache: "no-store" }).then(async response => response.ok ? response.json() : Promise.reject()).then((payload: { settings?: Record<string,string> }) => payload.settings && setLiveSettings(current => ({ ...current, ...payload.settings }))).catch(() => undefined);
  }, []);

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const params = new URLSearchParams(window.location.search);
    const tracking = {
      ref: params.get("ref") || document.referrer || "direct",
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_content: params.get("utm_content") || "",
      utm_term: params.get("utm_term") || "",
    };
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, ...tracking }),
      });
      const payload = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Não foi possível enviar agora.");
      form.reset();
      setStatus("success");
      setMessage(payload.message || "Recebemos sua ideia. A RRV entrará em contato para o diagnóstico inicial.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar agora.");
    }
  }

  return (
    <main className="start-site">
      <header className="start-header">
        <Link className="start-brand start-brand-header" href="/" aria-label="RRV.digital">
          <RRVLogo variant="monochrome" />
        </Link>
        <nav className={menuOpen ? "is-open" : ""} aria-label="Navegação da página Start">
          <a href="#solucoes" onClick={() => setMenuOpen(false)}>Soluções</a>
          <a href="#processo" onClick={() => setMenuOpen(false)}>Como funciona</a>
          <a href="#planos" onClick={() => setMenuOpen(false)}>Projetos</a>
          <a href="#top" onClick={() => setMenuOpen(false)}>Start</a>
          <Link href="/start/verify" onClick={() => setMenuOpen(false)}>RRV Verify</Link>
        </nav>
        <a className="start-header-cta" href="#projeto">Iniciar projeto <Arrow/></a>
        <button className="start-menu" type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><MenuIcon open={menuOpen}/></button>
      </header>

      <section className="start-hero" id="top">
        <div className="start-hero-copy">
          <p className="start-eyebrow"><span>RRV / START</span><span>Digital engineering studio</span></p>
          <h1>{(liveSettings.start_offer_title || "Transformamos ideias em software.").replace(" em ", " em|").split("|").map((part, index) => index === 0 ? <span key={part}>{part}<br/></span> : <em key={part}>{part}</em>)}</h1>
          <p className="start-lead">Sites, sistemas, automações, inteligência artificial e soluções digitais construídas de acordo com a necessidade real do projeto.</p>
          <div className="start-hero-actions"><a className="start-primary" href="#projeto">{liveSettings.start_primary_cta || "Iniciar projeto"} <Arrow/></a><a className="start-secondary" href="#solucoes">Ver soluções ↓</a></div>
        </div>
        <div className="start-system-map" aria-hidden="true">
          <div className="start-map-meta"><span>RRV / EXECUTION LAYER</span><span>SYS.01</span></div>
          <div className="start-map-core"><span>IDEIA</span><i/><b>01</b></div>
          <span className="start-node n1">Interface</span><span className="start-node n2">Dados</span><span className="start-node n3">Lógica</span><span className="start-node n4">Escala</span>
          <svg viewBox="0 0 600 520"><path d="M70 110C170 110 180 245 300 260S430 410 530 410"/><path d="M70 410C180 410 180 280 300 260S420 110 530 110"/><path d="M300 40V480"/></svg>
        </div>
        <div className="start-hero-foot"><strong>Projetos {liveSettings.start_starting_price || "A partir de R$ 199"}.</strong><span>Comece pequeno. Valide rápido.<br/>Escale quando fizer sentido.</span></div>
      </section>

      <section className="start-problem start-section">
        <div className="start-section-label"><span>01</span><span>Princípio</span></div>
        <div className="start-problem-copy"><h2>Você não precisa começar pagando pela infraestrutura que ainda não precisa.</h2><p>Uma ideia nova não precisa começar com um sistema gigantesco. Ela precisa provar que funciona. A RRV desenvolve a primeira versão e permite que a estrutura evolua conforme usuários, operações e demanda aumentarem.</p></div>
        <div className="start-progress" aria-label="Evolução de uma solução digital">{["Página", "MVP", "Banco", "Backend", "Automação", "IA", "VPS", "Escala"].map((item, index) => <div key={item}><span>{String(index + 1).padStart(2,"0")}</span><strong>{item}</strong><i/></div>)}</div>
      </section>

      <section className="start-solutions start-section" id="solucoes">
        <div className="start-section-label"><span>02</span><span>Soluções</span></div>
        <div className="start-section-head"><h2>O tamanho certo<br/>para o problema real.</h2><p>Da primeira página à infraestrutura dedicada, cada camada entra no momento em que passa a gerar valor.</p></div>
        <div className="start-solution-grid">{solutions.map(([code, title, copy, tag]) => <article key={code}><span>{code}</span><div><h3>{title}</h3><p>{copy}</p></div><small>{tag}</small><Arrow/></article>)}</div>
      </section>

      <section className="start-evolution start-section">
        <div className="start-section-label"><span>03</span><span>Modelo de evolução</span></div>
        <div className="start-section-head"><h2>Seu projeto pode começar simples sem terminar simples.</h2><p>Adicionamos cada etapa apenas quando existe necessidade real — sem antecipar custo, complexidade ou infraestrutura.</p></div>
        <div className="start-evolution-flow">{evolution.map(([name, detail], index) => <div key={name}><span>{String(index + 1).padStart(2,"0")}</span><strong>{name}</strong><p>{detail}</p><i/></div>)}</div>
      </section>

      <section className="start-plans start-section" id="planos">
        <div className="start-section-label"><span>04</span><span>Formas de começar</span></div>
        <div className="start-section-head"><h2>Uma porta de entrada.<br/>Vários caminhos de evolução.</h2><p>O valor inicial é uma referência para projetos simples. Soluções maiores são diagnosticadas e orçadas conforme o escopo.</p></div>
        <div className="start-plan-grid">{plans.map((plan) => <article className={plan.name === "START" ? "is-featured" : ""} key={plan.name}><div className="start-plan-top"><span>{plan.code}</span><b>{plan.name}</b></div><h3>{plan.price}</h3><p>{plan.copy}</p><ul>{plan.items.map(item => <li key={item}>{item}</li>)}</ul><a href="#projeto">{plan.cta} <Arrow/></a></article>)}</div>
      </section>

      <section className="start-process start-section" id="processo">
        <div className="start-section-label"><span>05</span><span>Como funciona</span></div>
        <div className="start-process-layout"><div><h2>Da conversa<br/>à execução.</h2><p>Você explica o problema. Nós organizamos a tecnologia, o escopo e a sequência de desenvolvimento.</p></div><div className="start-step-list">{steps.map(([number, title, copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></div>
      </section>

      <section className="start-engineering start-section">
        <div className="start-section-label"><span>06</span><span>Engenharia</span></div>
        <div className="start-engineering-copy"><h2>Você explica o problema.<br/><em>Nós definimos a tecnologia.</em></h2><p>O cliente não precisa saber se precisa de Node.js, PostgreSQL, API REST, VPS, IA, webhooks ou automação. Precisa dizer: “Quero que meu sistema faça isso.” A RRV transforma essa necessidade em uma arquitetura executável.</p></div>
        <div className="start-architecture" aria-label="Diagrama de arquitetura"><div className="start-arch-main">{["Usuário", "Frontend", "API", "Backend", "Banco"].map((item,index) => <span key={item}><b>{String(index + 1).padStart(2,"0")}</b>{item}</span>)}</div><div className="start-arch-side">{["IA", "Pagamentos", "WhatsApp", "E-mail", "Serviços externos"].map(item => <span key={item}>{item}</span>)}</div></div>
      </section>

      <section className="start-form-section start-section" id="projeto">
        <div className="start-section-label"><span>07</span><span>Iniciar projeto</span></div>
        <div className="start-form-intro"><h2>Conte sua ideia.</h2><p>Você não precisa preparar documentação técnica. Descreva o que quer resolver.</p></div>
        <form className="start-form" onSubmit={submitLead} noValidate>
          <div className="start-form-grid">
            <label><span>Nome *</span><input name="name" autoComplete="name" required minLength={2}/></label>
            <label><span>WhatsApp *</span><input name="whatsapp" autoComplete="tel" inputMode="tel" required minLength={8}/></label>
            <label><span>E-mail *</span><input name="email" type="email" autoComplete="email" required/></label>
            <label><span>Empresa ou projeto</span><input name="company" autoComplete="organization"/></label>
            <label><span>O que você precisa? *</span><select name="projectType" defaultValue="" required><option value="" disabled>Selecione</option>{projectOptions.map(option => <option key={option}>{option}</option>)}</select></label>
            <label><span>Faixa inicial de investimento *</span><select name="budget" defaultValue="" required><option value="" disabled>Selecione</option>{budgetOptions.map(option => <option key={option}>{option}</option>)}</select></label>
            <label className="start-wide"><span>Descrição da ideia *</span><textarea name="description" rows={4} required minLength={15} placeholder="O que você imagina construir?"/></label>
            <label className="start-wide"><span>Problema que deseja resolver *</span><textarea name="problem" rows={4} required minLength={15} placeholder="O que precisa funcionar melhor?"/></label>
            <label className="start-honeypot" aria-hidden="true"><span>Website</span><input name="website" tabIndex={-1} autoComplete="off"/></label>
            <label className="start-wide start-consent"><input name="consent" type="checkbox" required/><span>Li e aceito a <Link href="/privacidade" target="_blank">Política de Privacidade</Link> e autorizo o contato da RRV.digital sobre esta solicitação.</span></label>
          </div>
          <div className="start-form-submit"><p>Ao enviar, você autoriza a RRV.digital a usar estes dados exclusivamente para avaliar e responder à sua solicitação.</p><button type="submit" disabled={status === "sending"}>{status === "sending" ? "Enviando…" : "Enviar projeto para análise"} <Arrow/></button></div>
          {message && <div className={`start-form-message is-${status}`} role="status">{message}</div>}
        </form>
      </section>

      <a className="start-whatsapp" href={whatsappHref} target="_blank" rel="noreferrer" aria-label="Conversar com a RRV.digital pelo WhatsApp"><span>WA</span><i/></a>

      <footer className="start-footer"><div><Link className="start-brand start-brand-footer" href="/" aria-label="RRV.digital">
          <RRVLogo variant="white" />
        </Link><p>Growth. Experience. Engineering.</p></div><nav aria-label="Rodapé"><Link href="/">Home</Link><a href="#solucoes">Soluções</a><a href="#top">Start</a><a href="#projeto">Contato</a><Link href="/privacidade">Privacidade</Link></nav><div><span>Florianópolis - SC - Brasil</span><span>© 2026 RRV.digital</span></div></footer>
    </main>
  );
}
