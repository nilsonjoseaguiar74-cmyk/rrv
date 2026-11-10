"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useState, useEffect, useRef } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Plus,
  LayoutDashboard,
  Layers,
  Folder,
  Check,
  CheckCheck,
  GitBranch,
  FileText,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  ShieldCheck,
  Activity,
  Download,
  Clock,
  Target,
} from "lucide-react";
import {
  initialProjects,
  modules,
  states,
  versions,
} from "@/domain/verify/data";
import type { Project, Requirement, Result } from "@/domain/verify/data";
import type { VerifyProfile, VerifySession } from "@/domain/verify/models";
import {
  readVerifyProfile,
  readVerifyProjects,
  readVerifySessions,
  removeVerifySessions,
  saveVerifyProfile,
  saveVerifyProjects,
  saveVerifySessions,
} from "@/lib/verify/storage";
const nav = [
  ["dashboard", "Visão geral", LayoutDashboard],
  ["projects", "Meus projetos", Folder],
  ["modules", "Módulos", Layers],
  ["validations", "Validações", CheckCheck],
  ["evolution", "Evolução", GitBranch],
  ["reports", "Relatórios", FileText],
] as const;
function Brand({ small = false }: { small?: boolean }) {
  return (
    <span className={"brand " + (small ? "small" : "")}>
      <span className="official-horizontal">
        <Image
          src="/brand/verify/rrv-horizontal.png"
          alt="RRV.digital"
          width="1672"
          height="941"
        />
      </span>
      <Image
        className="official-symbol"
        src="/brand/verify/rrv-symbol.png"
        alt="RRV.digital"
        width="1233"
        height="1275"
      />
      <span className="brand-divider" />
      <span className="verify-name">
        Verify<span className="brand-dot">.</span>
      </span>
    </span>
  );
}

function Badge({ state }: { state: Result }) {
  return (
    <span className={"status s" + states.indexOf(state)}>
      <i />
      {state}
    </span>
  );
}
function Primary({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button className="primary" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
function Timeline({
  compact = false,
  onOpen,
}: {
  compact?: boolean;
  onOpen?: () => void;
}) {
  const [v, setV] = useState(2);
  return (
    <div className={"timeline " + (compact ? "compact" : "")}>
      <div className="section-title">
        <div>
          <span className="eyebrow">Trajetória do projeto</span>
          <h2>
            Evolution Timeline<span className="blue">.</span>
          </h2>
        </div>
        {onOpen && (
          <button className="text-button" onClick={onOpen}>
            Explorar histórico <ArrowUpRight size={16} />
          </button>
        )}
      </div>
      <div className="timeline-track">
        {versions.map((x, i) => (
          <button
            key={x.name}
            aria-pressed={v === i}
            className={"milestone " + (v === i ? "selected" : "")}
            onClick={() => setV(i)}
          >
            <span className="mono">{x.date}</span>
            <span className="track-line">
              <i>{v === i ? <Check size={13} /> : null}</i>
            </span>
            <strong>{x.name}</strong>
            <span>{x.title}</span>
            <small>
              {i === 0
                ? "Escopo registrado"
                : i === 1
                  ? "Correção informada"
                  : "Avaliação demonstrativa"}
            </small>
          </button>
        ))}
      </div>
      <div className="timeline-note">
        <GitBranch size={16} />
        <span>{versions[v].note}</span>
        <span className="mono">{versions[v].name}</span>
      </div>
    </div>
  );
}
export default function VerifyApp() {
  const pathname = usePathname(),
    router = useRouter();
  const routePath = pathname.replace(/^\/start\/verify\/?/, "");
  const route = routePath || "home";
  const projectRouteId =
    route.startsWith("projects/") && route !== "projects/new"
      ? route.slice("projects/".length)
      : "";
  const [projects, setProjects] = useState<Project[]>(initialProjects),
    [storageLoaded, setStorageLoaded] = useState(false),
    [selected, setSelected] = useState("singulai"),
    [mobile, setMobile] = useState(false),
    [notice, setNotice] = useState(""),
    [account, setAccount] = useState(false),
    [filter, setFilter] = useState(""),
    [detail, setDetail] = useState<Requirement | null>(null),
    [version, setVersion] = useState(2),
    [compare, setCompare] = useState(0),
    [mode, setMode] = useState("Selecionada"),
    [chosen, setChosen] = useState<string[]>([]),
    [confirmed, setConfirmed] = useState(false),
    [sessions, setSessions] = useState<VerifySession[]>([]),
    [reportState, setReportState] = useState("Todos"),
    [reportModule, setReportModule] = useState("Todos"),
    [reportFrom, setReportFrom] = useState(""),
    [reportTo, setReportTo] = useState(""),
    [saved, setSaved] = useState(true);
  const activeProjectId = projectRouteId || selected;
  const foundProject = projects.find((x) => x.id === activeProjectId);
  const project = foundProject || initialProjects[0];
  const invalidProject = Boolean(projectRouteId && !foundProject);
  const catalog = [...modules, ...(project.customModules || [])];
  const [customName, setCustomName] = useState(""),
    [customDescription, setCustomDescription] = useState("");
  const availableVersions =
    project.id === "singulai"
      ? versions
      : [{ name: "v0.1", date: "Escopo inicial", iso: "" }];
  const [profile, setProfile] = useState<VerifyProfile>({
    name: "Rodrigo Alves",
    workspace: "RRV.digital",
  });
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    try {
      const value = readVerifyProfile();
      if (value) startTransition(() => setProfile(value));
    } catch {
      startTransition(() =>
        setNotice("Não foi possível carregar as preferências locais."),
      );
    }
  }, []);
  useEffect(() => {
    if (!detail) return;
    const before = document.activeElement as HTMLElement;
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetail(null);
      if (e.key === "Tab") {
        const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button,[href],input,select,textarea,[tabindex="0"]',
        );
        if (nodes?.length) {
          const first = nodes[0],
            last = nodes[nodes.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
      before?.focus();
    };
  }, [detail]);
  function go(path: string) {
    const destinationProjectId =
      path.startsWith("projects/") && path !== "projects/new"
        ? path.slice("projects/".length)
        : projectRouteId;
    if (
      destinationProjectId &&
      projects.some((p) => p.id === destinationProjectId)
    ) {
      setSelected(destinationProjectId);
      setVersion(destinationProjectId === "singulai" ? 2 : 0);
    }
    router.push(path === "home" ? "/start/verify" : `/start/verify/${path}`);
    setMobile(false);
    setFilter("");
    setDetail(null);
    setConfirmed(false);
    window.scrollTo({ top: 0 });
  }
  useEffect(() => {
    try {
      const storedProjects = readVerifyProjects();
      const storedSessions = readVerifySessions();
      startTransition(() => {
        if (storedProjects) setProjects(storedProjects);
        if (storedSessions) setSessions(storedSessions);
        setStorageLoaded(true);
      });
    } catch {
      startTransition(() =>
        setNotice(
          "Não foi possível recuperar os dados locais. Os dados demonstrativos iniciais permanecem disponíveis.",
        ),
      );
      startTransition(() => setStorageLoaded(true));
    }
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(t);
  }, [notice]);
  function persist(next: Project[]) {
    setProjects(next);
    try {
      saveVerifyProjects(next);
      return true;
    } catch {
      setNotice(
        "Armazenamento indisponível. Os dados serão mantidos apenas nesta sessão.",
      );
      return false;
    }
  }
  const reqs = project.requirements;
  const allReqs = projects.flatMap((x) => x.requirements);
  const runsCount =
    projects.filter((p) => p.id === "singulai").length * versions.length;
  const pageTitle = route.startsWith("projects/")
    ? route === "projects/new"
      ? "Novo projeto"
      : project.name
    : nav.find((x) => x[0] === route)?.[1] || "Configurações";
  function projectSelect() {
    return (
      <label className="project-select">
        <span className="sr-only">Projeto selecionado</span>
        <Folder size={14} />
        <select
          aria-label="Projeto selecionado"
          value={activeProjectId}
          onChange={(e) => {
            setSelected(e.target.value);
            setVersion(e.target.value === "singulai" ? 2 : 0);
            if (route.startsWith("projects/") && route !== "projects/new")
              go("projects/" + e.target.value);
            setChosen([]);
            setConfirmed(false);
          }}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
    );
  }
  function requirementTable(items: Requirement[] = reqs, vi = version) {
    return (
      <div className="req-list">
        {items.length ? (
          items.map((r) => (
            <button className="req-row" key={r.id} onClick={() => setDetail(r)}>
              <span className="mono muted">{r.id}</span>
              <div>
                <strong>{r.description}</strong>
                <small>
                  {r.module} ·{" "}
                  {r.implemented
                    ? "Implementado no cenário"
                    : "Ainda não implementado"}
                </small>
              </div>
              <Badge state={r.results[vi]} />
              <ChevronRight size={16} />
            </button>
          ))
        ) : (
          <div className="empty">
            <Target size={26} />
            <h3>Nenhum requisito neste recorte.</h3>
            <p>Defina seus critérios no cadastro ou ajuste os filtros.</p>
          </div>
        )}
      </div>
    );
  }
  function exportReport() {
    const rows = reqs.filter(
      (r) =>
        (reportState === "Todos" || r.results[version] === reportState) &&
        (reportModule === "Todos" || r.module === reportModule) &&
        (!reportFrom ||
          (availableVersions[version]?.iso || "") >= reportFrom) &&
        (!reportTo ||
          (!!availableVersions[version]?.iso &&
            availableVersions[version].iso <= reportTo)),
    );
    const data = {
      ambiente: "Protótipo / Dados demonstrativos",
      project: project.name,
      version: versions[version].name,
      date: availableVersions[version]?.iso || "Sem avaliação",
      requirements: rows.map((r) => ({ ...r, result: r.results[version] })),
    };
    const u = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = u;
    a.download = "rrv-verify-relatorio-demo.json";
    a.click();
    URL.revokeObjectURL(u);
    setNotice("Relatório demonstrativo exportado.");
  }
  if (projectRouteId && !storageLoaded) {
    return (
      <div id="rrv-verify">
        <div className="demo-bar">
          <span className="live-dot" />
          Protótipo / Dados demonstrativos
          <span className="demo-extra">
            Nenhuma verificação real é executada
          </span>
        </div>
        <div className="app-shell">
          <main className="content">
            <p role="status">Carregando projeto demonstrativo…</p>
          </main>
        </div>
      </div>
    );
  }
  if (invalidProject) {
    return (
      <div id="rrv-verify">
        <div className="demo-bar">
          <span className="live-dot" />
          Protótipo / Dados demonstrativos
          <span className="demo-extra">
            Nenhuma verificação real é executada
          </span>
        </div>
        <div className="app-shell">
          <main className="content">
            <section className="empty" aria-labelledby="project-not-found">
              <Folder size={28} />
              <h1 id="project-not-found">Projeto não encontrado.</h1>
              <p>
                Este projeto não existe neste navegador ou foi removido dos
                dados demonstrativos.
              </p>
              <Link className="outline" href="/start/verify/projects">
                Voltar aos projetos
              </Link>
            </section>
          </main>
        </div>
      </div>
    );
  }
  return (
    <div id="rrv-verify">
      <div className="demo-bar">
        <span className="live-dot" />
        Protótipo / Dados demonstrativos{" "}
        <span className="demo-extra">Nenhuma verificação real é executada</span>
      </div>
      {route === "home" ? (
        <div className="landing">
          <header className="landing-nav">
            <Brand />
            <div className="nav-links">
              <Link href="#metodo">O método</Link>
              <Link href="#trajetoria">A evolução</Link>
              <Link className="outline" href="/start/verify/dashboard">
                Acessar protótipo <ArrowUpRight size={16} />
              </Link>
            </div>
          </header>
          <main>
            <section className="hero">
              <div className="hero-copy">
                <span className="eyebrow">
                  <span className="tiny-cross">+</span> RRV.digital /
                  Engineering
                </span>
                <h1>
                  A evolução do
                  <br />
                  seu projeto,
                  <br />
                  <span>comprovada.</span>
                </h1>
                <p>
                  Da intenção à evidência. Um espaço para definir o que importa,
                  verificar cada entrega e preservar toda a sua trajetória.
                </p>
                <div className="hero-actions">
                  <Link className="primary" href="/start/verify/dashboard">
                    Explorar a plataforma <ArrowUpRight size={18} />
                  </Link>
                  <span className="mono muted">
                    Escopo claro.
                    <br />
                    Histórico preservado.
                  </span>
                </div>
              </div>
              <div
                className="hero-art"
                aria-label="Trajetória ilustrativa do projeto SingulAI"
              >
                <div className="art-top">
                  <span className="mono">SINGULAI / EVOLUTION RECORD</span>
                  <span className="blue">
                    <Activity size={17} />
                  </span>
                </div>
                <div className="orbit-label mono">
                  Cada versão, uma nova evidência.
                </div>
                <div className="engineering-art">
                  <svg
                    viewBox="0 0 560 340"
                    role="img"
                    aria-label="Três versões conectadas, com histórico preservado"
                  >
                    <defs>
                      <pattern
                        id="grid"
                        width="28"
                        height="28"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M28 0H0V28"
                          stroke="#9eeaff"
                          strokeOpacity=".09"
                          fill="none"
                        />
                      </pattern>
                    </defs>
                    <rect width="560" height="340" fill="url(#grid)" />
                    <path
                      d="M40 260H170V180H320V95H510"
                      fill="none"
                      stroke="#9eeaff"
                      strokeOpacity=".16"
                      strokeWidth="22"
                    />
                    <path
                      d="M40 260H170V180H320V95H510"
                      fill="none"
                      stroke="#9eeaff"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M40 294H510M40 220H510M40 138H510M40 55H510"
                      stroke="#6a7679"
                      strokeOpacity=".2"
                      strokeDasharray="3 7"
                    />
                    {[
                      [90, 260],
                      [245, 180],
                      [430, 95],
                    ].map(([x, y], i) => (
                      <g key={x}>
                        <circle
                          cx={x}
                          cy={y}
                          r="19"
                          fill="#101416"
                          stroke="#9eeaff"
                          strokeOpacity={i === 2 ? 1 : 0.3}
                        />
                        <circle
                          cx={x}
                          cy={y}
                          r="5"
                          fill={i === 2 ? "#9eeaff" : "#74878c"}
                        />
                        <text
                          x={x}
                          y={y + 51}
                          fill="#eef2ef"
                          textAnchor="middle"
                          fontSize="15"
                          fontFamily="monospace"
                        >
                          v0.{i + 1}
                        </text>
                        <text
                          x={x}
                          y={y + 73}
                          fill="#9ca5a3"
                          textAnchor="middle"
                          fontSize="10"
                          fontFamily="monospace"
                        >
                          {["ESCOPO", "EVOLUÇÃO", "EVIDÊNCIA"][i]}
                        </text>
                      </g>
                    ))}
                    <path d="m493 88 8 7-8 7" stroke="#9eeaff" fill="none" />
                  </svg>
                </div>
                <div className="art-foot">
                  <span>
                    <span className="tiny-square" /> Histórico imutável no
                    protótipo
                  </span>
                  <span className="mono">01 → 03</span>
                </div>
                <div className="art-floating">
                  <ShieldCheck size={20} />
                  <div>
                    <strong>Critérios antes de opiniões.</strong>
                    <small>Avaliações vinculadas ao escopo aprovado.</small>
                  </div>
                </div>
              </div>
            </section>
            <section className="principles" id="metodo">
              <div>
                <span className="eyebrow">Um método. Toda a trajetória.</span>
                <h2>
                  O combinado é o<br />
                  ponto de partida.
                </h2>
              </div>
              <div className="method">
                <span>Objetivo</span>
                <ArrowRight />
                <span>Requisito</span>
                <ArrowRight />
                <span>Critério</span>
                <ArrowRight />
                <span>Verificação</span>
                <ArrowRight />
                <span>Evidência</span>
                <ArrowRight />
                <span className="blue">Evolução</span>
                <p>
                  Avalie o que foi definido pelo cliente. Sem exigências
                  inventadas, sem perder o que veio antes.
                </p>
              </div>
            </section>
            <section id="trajetoria">
              <Timeline onOpen={() => go("evolution")} />
            </section>
            <section className="landing-end">
              <div>
                <span className="eyebrow">Conheça por dentro</span>
                <h2>
                  Menos suposições.
                  <br />
                  Mais rastreabilidade.
                </h2>
              </div>
              <Link className="primary" href="/start/verify/dashboard">
                Abrir ambiente demonstrativo <ArrowUpRight size={18} />
              </Link>
            </section>
          </main>
          <footer>
            <span className="official-portrait">
              <Image
                src="/brand/verify/rrv-vertical.png"
                alt="RRV.digital — marca oficial"
                width="1122"
                height="1402"
                loading="lazy"
              />
            </span>
            <span>Um produto RRV.digital</span>
            <span className="mono">Engineering with purpose.</span>
          </footer>
        </div>
      ) : (
        <div className="app-shell">
          <aside className={mobile ? "sidebar open" : "sidebar"}>
            <button className="brand-link" onClick={() => go("home")}>
              <Brand />
            </button>
            <button
              className="close-menu icon-button"
              aria-label="Fechar menu"
              onClick={() => setMobile(false)}
            >
              <X />
            </button>
            <div className="workspace-label mono">
              WORKSPACE <span>{profile.workspace.toUpperCase()}</span>
            </div>
            <nav>
              {nav.map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => go(id)}
                  className={
                    route === id ||
                    (id === "projects" && route.startsWith("projects/"))
                      ? "active"
                      : ""
                  }
                >
                  <Icon size={18} />
                  {label}
                  {id === "projects" && (
                    <span className="nav-count">
                      {projects.length.toString().padStart(2, "0")}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="scope-note">
                <ShieldCheck size={20} />
                <strong>O seu escopo é o guia.</strong>
                <p>Cada verificação começa com o que você definiu.</p>
              </div>
              <button
                onClick={() => go("settings")}
                className={route === "settings" ? "active" : ""}
              >
                <Settings size={18} />
                Configurações
              </button>
              <button onClick={() => go("home")}>
                <ArrowUpRight size={18} />
                Sobre o Verify
              </button>
              <span className="mono sidebar-version">
                RRV VERIFY / PROTOTYPE 1.0
              </span>
            </div>
          </aside>
          {mobile && (
            <button
              className="backdrop"
              aria-label="Fechar navegação"
              onClick={() => setMobile(false)}
            />
          )}
          <div className="app-main">
            <header className="topbar">
              <button
                className="mobile-menu icon-button"
                aria-label="Abrir navegação"
                onClick={() => setMobile(true)}
              >
                <Menu size={20} />
              </button>
              <Image
                className="mobile-brand-icon"
                src="/brand/verify/rrv-symbol.png"
                alt="RRV.digital"
                width="24"
                height="25"
              />
              <span className="breadcrumb">
                Workspace <ChevronRight size={13} />
                <strong>{pageTitle}</strong>
              </span>
              <div className="topbar-right">
                {projectSelect()}
                <span className="top-separator" />
                <button
                  aria-expanded={account}
                  className="account"
                  onClick={() => setAccount(!account)}
                >
                  <span>RA</span>
                  <ChevronDown size={13} />
                </button>
                {account && (
                  <div className="account-pop">
                    <strong>{profile.name}</strong>
                    <p>Conta fictícia · Sem autenticação</p>
                    <button
                      onClick={() => {
                        go("settings");
                        setAccount(false);
                      }}
                    >
                      Preferências <Settings size={15} />
                    </button>
                  </div>
                )}
              </div>
            </header>
            <main className="content" key={route}>
              {(route === "dashboard" || route === "projects") && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">
                        {route === "dashboard"
                          ? "Seu ponto de partida"
                          : "Portfólio de projetos"}
                      </span>
                      <h1>
                        Seus projetos<span className="blue">.</span>
                      </h1>
                      <p>
                        Objetivos definidos, verificações registradas e
                        trajetória preservada.
                      </p>
                    </div>
                    <Primary onClick={() => go("projects/new")}>
                      <Plus size={17} />
                      Novo projeto
                    </Primary>
                  </div>
                  <div className="metrics">
                    {[
                      [
                        String(projects.length).padStart(2, "0"),
                        "Projetos cadastrados",
                        Folder,
                      ],
                      [
                        String(allReqs.length).padStart(2, "0"),
                        "Requisitos definidos",
                        Target,
                      ],
                      [
                        String(runsCount).padStart(2, "0"),
                        "Avaliações demonstrativas",
                        CheckCheck,
                      ],
                      ["04 nov", "Última avaliação · 2026", Clock],
                    ].map(([val, label, Icon]) => (
                      <div className="metric" key={String(label)}>
                        <div>
                          <span>{String(label)}</span>
                          <Icon size={17} />
                        </div>
                        <strong>{String(val)}</strong>
                        <small>
                          {label === "Avaliações demonstrativas"
                            ? "Dados sintéticos do projeto piloto"
                            : label === "Última avaliação · 2026"
                              ? "SingulAI · v0.3"
                              : "No seu workspace"}
                        </small>
                      </div>
                    ))}
                  </div>
                  <div className="section-title projects-heading">
                    <h2>
                      Projetos em acompanhamento{" "}
                      <span className="muted small-text">
                        / {projects.length.toString().padStart(2, "0")}
                      </span>
                    </h2>
                    <label className="search">
                      <Search size={16} />
                      <input
                        placeholder="Buscar projeto"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        aria-label="Buscar projeto"
                      />
                    </label>
                  </div>
                  <div className="projects-list">
                    {projects
                      .filter((p) =>
                        p.name.toLowerCase().includes(filter.toLowerCase()),
                      )
                      .map((p, i) => (
                        <div className="project-card" key={p.id}>
                          <div className="project-emblem">
                            {p.id === "singulai" ? (
                              <span>
                                S<span className="blue">^</span>
                              </span>
                            ) : (
                              <Folder size={32} />
                            )}
                          </div>
                          <div className="project-main">
                            <div className="project-meta mono">
                              <span>{p.segment}</span>
                              <span>PROJ-{String(i + 1).padStart(3, "0")}</span>
                            </div>
                            <h2>
                              {p.name}
                              <ArrowUpRight size={21} />
                            </h2>
                            <p>{p.description}</p>
                            <div className="project-tags">
                              {p.types.map((t) => (
                                <span key={t}>{t}</span>
                              ))}
                            </div>
                          </div>
                          <div className="project-summary">
                            <span className="mono muted">
                              {p.id === "singulai"
                                ? "VERSÃO DE REFERÊNCIA / v0.3"
                                : "ESCOPO INICIAL / v0.1"}
                            </span>
                            <div className="mini-progress">
                              {p.requirements.map((r) => (
                                <i
                                  key={r.id}
                                  className={"s" + states.indexOf(r.results[2])}
                                />
                              ))}
                            </div>
                            <span>
                              {
                                p.requirements.filter(
                                  (r) => r.results[2] === "Atendido",
                                ).length
                              }{" "}
                              de {p.requirements.length} requisitos atendidos
                            </span>
                            <small>
                              Última avaliação:{" "}
                              {p.id === "singulai"
                                ? "04 nov 2026"
                                : "Não avaliado"}
                            </small>
                            <button
                              className="outline"
                              onClick={() => {
                                setSelected(p.id);
                                setVersion(p.id === "singulai" ? 2 : 0);
                                go("projects/" + p.id);
                              }}
                            >
                              Abrir projeto <ArrowRight size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    {!projects.some((p) =>
                      p.name.toLowerCase().includes(filter.toLowerCase()),
                    ) && (
                      <div className="empty">Nenhum projeto encontrado.</div>
                    )}
                  </div>
                  <div className="dashboard-lower">
                    <div>
                      <span className="timeline-project-label mono">
                        SingulAI / Projeto piloto
                      </span>
                      <Timeline
                        compact
                        onOpen={() => {
                          setSelected("singulai");
                          setVersion(2);
                          go("evolution");
                        }}
                      />
                    </div>
                    <section className="recent">
                      <div className="section-title">
                        <h2>Registro recente</h2>
                        <Activity size={18} />
                      </div>
                      {[
                        ...sessions
                          .slice(-2)
                          .reverse()
                          .map((x) => ({
                            name: "Escopo confirmado",
                            text: x.project + " · " + x.count + " requisitos",
                            date: "Agora",
                          })),
                        {
                          name: "Avaliação registrada",
                          text: "SingulAI · v0.3 · Demonstrativa",
                          date: "04 nov",
                        },
                        {
                          name: "Correção informada",
                          text: "REQ-02 · Dashboard do usuário",
                          date: "28 out",
                        },
                        {
                          name: "Escopo aprovado",
                          text: "SingulAI · 8 requisitos",
                          date: "21 out",
                        },
                      ]
                        .slice(0, 4)
                        .map((r, i) => (
                          <div className="event" key={i}>
                            <span className="event-dot" />
                            <div>
                              <strong>{r.name}</strong>
                              <small>{r.text}</small>
                            </div>
                            <span className="mono">{r.date}</span>
                          </div>
                        ))}
                      <p className="footnote">
                        Registros sintéticos. Nenhum teste real executado.
                      </p>
                    </section>
                  </div>
                </>
              )}
              {route === "projects/new" && (
                <ProjectForm
                  onCancel={() => go("projects")}
                  onSave={(p) => {
                    const stored = persist([...projects, p]);
                    setSelected(p.id);
                    setVersion(0);
                    if (stored)
                      setNotice(
                        "Projeto demonstrativo cadastrado. Escopo preservado.",
                      );
                    go("projects/" + p.id);
                  }}
                />
              )}
              {route.startsWith("projects/") && route !== "projects/new" && (
                <>
                  <button
                    className="text-button back"
                    onClick={() => go("projects")}
                  >
                    <ArrowLeft size={15} />
                    Meus projetos
                  </button>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">
                        {project.segment} / Projeto demonstrativo
                      </span>
                      <h1>
                        {project.name}
                        <span className="blue">.</span>
                      </h1>
                      <p>{project.description}</p>
                    </div>
                    <Primary onClick={() => go("validations")}>
                      Definir validação <ArrowUpRight size={17} />
                    </Primary>
                  </div>
                  <div className="project-info">
                    <div>
                      <span>Responsável</span>
                      <strong>{project.owner}</strong>
                    </div>
                    <div>
                      <span>Objetivo</span>
                      <strong>{project.objectives}</strong>
                    </div>
                    <div>
                      <span>Referência</span>
                      <strong>{project.url || "URL não informada"}</strong>
                    </div>
                  </div>
                  <div className="section-title">
                    <h2>
                      Requisitos e critérios{" "}
                      <span className="muted small-text">/ {reqs.length}</span>
                    </h2>
                    <select
                      aria-label="Versão de referência"
                      value={version}
                      onChange={(e) => setVersion(+e.target.value)}
                    >
                      {availableVersions.map((v, i) => (
                        <option value={i} key={v.name}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {requirementTable()}
                  <div className="detail-columns">
                    <section>
                      <span className="eyebrow">Como funciona</span>
                      <p>{project.flows}</p>
                    </section>
                    <section>
                      <span className="eyebrow">Procedimentos definidos</span>
                      <p>
                        {project.procedures ||
                          "Nenhum procedimento adicional informado."}
                      </p>
                    </section>
                  </div>
                  {project.id === "singulai" ? (
                    <Timeline onOpen={() => go("evolution")} />
                  ) : (
                    <p className="footnote">
                      Escopo inicial registrado. Nenhuma avaliação realizada.
                    </p>
                  )}
                </>
              )}
              {route === "modules" && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">
                        Escopo adaptativo / {project.name}
                      </span>
                      <h1>
                        O que faz sentido
                        <br />
                        verificar<span className="blue">?</span>
                      </h1>
                      <p>
                        Selecione os módulos do seu projeto. Nenhum é
                        obrigatório.
                      </p>
                    </div>
                    <span className="mono selection-counter">
                      {project.modules.length.toString().padStart(2, "0")} /{" "}
                      {catalog.length} selecionados
                    </span>
                  </div>
                  <div className="module-grid">
                    {catalog.map(([id, name, desc]) => {
                      const linked = reqs.filter((r) => r.module === id);
                      const sel = project.modules.includes(id);
                      const evaluated = linked.some(
                        (r) => r.results[version] !== "Não avaliado",
                      );
                      return (
                        <button
                          aria-pressed={sel}
                          className={"module " + (sel ? "selected" : "")}
                          key={id}
                          onClick={() =>
                            persist(
                              projects.map((p) =>
                                p.id === selected
                                  ? {
                                      ...p,
                                      modules: sel
                                        ? p.modules.filter((m) => m !== id)
                                        : [...p.modules, id],
                                    }
                                  : p,
                              ),
                            )
                          }
                        >
                          <div className="module-top">
                            <span className="mono">{id}</span>
                            <span className="check-box">
                              {sel && <Check size={14} />}
                            </span>
                          </div>
                          <h2>{name}</h2>
                          <p>{desc}</p>
                          <div className="module-bottom">
                            <span>{linked.length} requisitos vinculados</span>
                            <span>
                              {sel ? "Selecionado" : "Não selecionado"}
                            </span>
                          </div>
                          <small>
                            {linked.length
                              ? "Aplicável pelo escopo"
                              : "Aplicabilidade a confirmar"}{" "}
                            ·{" "}
                            {evaluated
                              ? "Com avaliação demonstrativa"
                              : "Ainda não avaliado"}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                  <details className="custom-module">
                    <summary>Definir módulo especializado</summary>
                    <p>
                      Crie uma classificação própria para o escopo declarado.
                      Isso não acrescenta requisitos.
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const code =
                          "MX" +
                          String(
                            (project.customModules?.length || 0) + 1,
                          ).padStart(2, "0");
                        persist(
                          projects.map((p) =>
                            p.id === selected
                              ? {
                                  ...p,
                                  customModules: [
                                    ...(p.customModules || []),
                                    [
                                      code,
                                      customName.trim(),
                                      customDescription.trim(),
                                    ],
                                  ],
                                  modules: [...p.modules, code],
                                }
                              : p,
                          ),
                        );
                        setCustomName("");
                        setCustomDescription("");
                        setNotice(
                          "Módulo especializado adicionado ao projeto.",
                        );
                      }}
                    >
                      <label>
                        Nome do módulo
                        <input
                          value={customName}
                          required
                          onChange={(e) => setCustomName(e.target.value)}
                        />
                      </label>
                      <label>
                        Descrição do escopo
                        <input
                          value={customDescription}
                          required
                          onChange={(e) => setCustomDescription(e.target.value)}
                        />
                      </label>
                      <Primary
                        disabled={
                          !customName.trim() || !customDescription.trim()
                        }
                      >
                        <Plus size={15} />
                        Adicionar módulo
                      </Primary>
                    </form>
                  </details>
                </>
              )}
              {route === "validations" && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">Do critério à evidência</span>
                      <h1>
                        Defina a próxima
                        <br />
                        verificação<span className="blue">.</span>
                      </h1>
                      <p>Você escolhe o escopo. O histórico permanece.</p>
                    </div>
                  </div>
                  <div className="notice-panel">
                    <ShieldCheck size={20} />
                    <p>
                      <strong>Uma simulação transparente.</strong> Você pode
                      confirmar uma seleção. Nenhum teste será executado e
                      nenhum resultado será inventado.
                    </p>
                  </div>
                  <div className="validation-controls">
                    {projectSelect()}
                    <label>
                      Versão
                      <select
                        value={version}
                        onChange={(e) => {
                          setVersion(+e.target.value);
                          setConfirmed(false);
                        }}
                      >
                        {availableVersions.map((v, i) => (
                          <option value={i} key={v.name}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="mode-grid">
                    {[
                      ["Isolada", "Um requisito por vez."],
                      ["Selecionada", "Um conjunto definido por você."],
                      ["Completa", "Todo o escopo tecnicamente verificável."],
                    ].map(([n, d]) => (
                      <button
                        aria-pressed={mode === n}
                        className={mode === n ? "mode active" : "mode"}
                        key={n}
                        onClick={() => {
                          setMode(n);
                          setChosen([]);
                          setConfirmed(false);
                        }}
                      >
                        <span className="radio">{mode === n && <i />}</span>
                        <strong>{n}</strong>
                        <p>{d}</p>
                      </button>
                    ))}
                  </div>
                  <div className="section-title">
                    <h2>Requisitos do escopo</h2>
                    <span className="mono muted">
                      {mode === "Completa"
                        ? reqs.filter((r) => r.implemented).length
                        : chosen.length}{" "}
                      selecionados
                    </span>
                  </div>
                  <div className="selection-list">
                    {reqs.map((r) => {
                      const checked =
                        mode === "Completa"
                          ? r.implemented
                          : chosen.includes(r.id);
                      return (
                        <label className="select-req" key={r.id}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={mode === "Completa"}
                            onChange={() => {
                              setChosen(
                                mode === "Isolada"
                                  ? checked
                                    ? []
                                    : [r.id]
                                  : checked
                                    ? chosen.filter((x) => x !== r.id)
                                    : [...chosen, r.id],
                              );
                              setConfirmed(false);
                            }}
                          />
                          <span className="mono muted">{r.id}</span>
                          <strong>{r.description}</strong>
                          <small>
                            {mode === "Completa" && !r.implemented
                              ? "Fora desta execução: não implementado"
                              : r.module}
                          </small>
                        </label>
                      );
                    })}
                  </div>
                  <div className="action-strip">
                    <p>Confirmação registra apenas a intenção demonstrativa.</p>
                    <Primary
                      disabled={
                        !(mode === "Completa"
                          ? reqs.some((r) => r.implemented)
                          : chosen.length) || confirmed
                      }
                      onClick={() => {
                        setConfirmed(true);
                        const run = {
                          id: crypto.randomUUID(),
                          project: project.name,
                          version: versions[version].name,
                          count:
                            mode === "Completa"
                              ? reqs.filter((r) => r.implemented).length
                              : chosen.length,
                          mode,
                          date: new Date().toLocaleDateString("pt-BR"),
                        };
                        const next = [...sessions, run];
                        setSessions(next);
                        try {
                          saveVerifySessions(next);
                          setNotice(
                            "Escopo confirmado. Nenhuma verificação real executada.",
                          );
                        } catch {
                          setNotice(
                            "Escopo confirmado apenas nesta sessão. O armazenamento local está indisponível.",
                          );
                        }
                      }}
                    >
                      {confirmed ? (
                        <>
                          <Check size={17} />
                          Escopo confirmado
                        </>
                      ) : (
                        <>
                          Confirmar escopo <ArrowRight size={17} />
                        </>
                      )}
                    </Primary>
                  </div>
                  {sessions.length > 0 && (
                    <>
                      <h2 className="spaced">Confirmações demonstrativas</h2>
                      {sessions.map((s) => (
                        <div className="execution" key={s.id}>
                          <span>
                            {s.project} · {s.version}
                          </span>
                          <span>
                            {s.mode} · {s.count} requisitos
                          </span>
                          <span className="mono">{s.date}</span>
                          <span className="blue">Não executado</span>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
              {route === "evolution" && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">
                        Cada entrega conta / {project.name}
                      </span>
                      <h1>
                        Uma trajetória.
                        <br />
                        Todas as evidências<span className="blue">.</span>
                      </h1>
                      <p>
                        Explore versões e compare critérios sem apagar
                        resultados anteriores.
                      </p>
                    </div>
                  </div>
                  {project.id === "singulai" ? (
                    <>
                      <Timeline />
                      <div className="section-title spaced">
                        <h2>O que mudou entre versões</h2>
                        <div className="compare-selects">
                          <select
                            aria-label="Versão anterior"
                            value={compare}
                            onChange={(e) => setCompare(+e.target.value)}
                          >
                            {availableVersions.map((v, i) => (
                              <option key={v.name} value={i}>
                                {v.name}
                              </option>
                            ))}
                          </select>
                          <ArrowRight size={17} />
                          <select
                            aria-label="Versão posterior"
                            value={version}
                            onChange={(e) => setVersion(+e.target.value)}
                          >
                            {availableVersions.map((v, i) => (
                              <option key={v.name} value={i}>
                                {v.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="comparison-head">
                        <span>Requisito</span>
                        <span>{versions[compare].name}</span>
                        <span>{versions[version].name}</span>
                      </div>
                      {reqs.map((r) => (
                        <button
                          className="comparison"
                          key={r.id}
                          onClick={() => setDetail(r)}
                        >
                          <span>
                            <small className="mono muted">{r.id}</small>
                            <strong>{r.description}</strong>
                            {r.results[compare] !== r.results[version] && (
                              <small className="blue">
                                Resultado alterado nesta comparação
                              </small>
                            )}
                          </span>
                          <Badge state={r.results[compare]} />
                          <Badge state={r.results[version]} />
                        </button>
                      ))}
                      <div className="notice-panel">
                        <GitBranch size={20} />
                        <p>
                          <strong>
                            Informar uma correção não equivale a verificá-la.
                          </strong>{" "}
                          Em v0.2, o desenvolvedor informou a correção de
                          REQ-02. Seu resultado só muda em v0.3, na nova
                          avaliação sintética.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="empty">
                      <GitBranch size={28} />
                      <h2>Sua trajetória começa aqui.</h2>
                      <p>
                        Escopo inicial registrado. Nenhuma avaliação realizada
                        para este projeto.
                      </p>
                      <button
                        className="outline"
                        onClick={() => go("validations")}
                      >
                        Definir uma validação <ArrowRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
              {route === "reports" && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">
                        Rastreabilidade em detalhe
                      </span>
                      <h1>
                        Resultados com
                        <br />
                        contexto<span className="blue">.</span>
                      </h1>
                      <p>
                        Consulte critérios, estados e evidências de cada versão.
                      </p>
                    </div>
                    <button className="outline" onClick={exportReport}>
                      <Download size={16} />
                      Exportar JSON
                    </button>
                  </div>
                  <div className="report-filters">
                    <label>
                      Versão
                      <select
                        value={version}
                        onChange={(e) => setVersion(+e.target.value)}
                      >
                        {availableVersions.map((v, i) => (
                          <option key={v.name} value={i}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Módulo
                      <select
                        value={reportModule}
                        onChange={(e) => setReportModule(e.target.value)}
                      >
                        <option>Todos</option>
                        {modules.map(([id, n]) => (
                          <option key={id} value={id}>
                            {id} · {n}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Resultado
                      <select
                        value={reportState}
                        onChange={(e) => setReportState(e.target.value)}
                      >
                        <option>Todos</option>
                        {states.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      De
                      <input
                        type="date"
                        value={reportFrom}
                        onChange={(e) => setReportFrom(e.target.value)}
                      />
                    </label>
                    <label>
                      Até
                      <input
                        type="date"
                        value={reportTo}
                        onChange={(e) => setReportTo(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="report-intro">
                    <div>
                      <span className="eyebrow">
                        Relatório demonstrativo / {versions[version].name}
                      </span>
                      <h2>{project.name}</h2>
                      <p>
                        Referência:{" "}
                        {availableVersions[version]?.date || "Sem avaliação"} ·{" "}
                        {reqs.length} requisitos definidos
                      </p>
                    </div>
                    <span className="report-stamp">
                      <ShieldCheck size={23} />
                      DADOS
                      <br />
                      SINTÉTICOS
                    </span>
                  </div>
                  {requirementTable(
                    reqs.filter(
                      (r) =>
                        (reportState === "Todos" ||
                          r.results[version] === reportState) &&
                        (reportModule === "Todos" ||
                          r.module === reportModule) &&
                        (!reportFrom ||
                          (availableVersions[version]?.iso || "") >=
                            reportFrom) &&
                        (!reportTo ||
                          (!!availableVersions[version]?.iso &&
                            availableVersions[version].iso <= reportTo)),
                    ),
                  )}
                  <p className="footnote">
                    Abra um requisito para consultar critério, evidência
                    ilustrativa, observações e histórico. Estes registros não
                    comprovam o funcionamento real do projeto.
                  </p>
                </>
              )}
              {route === "settings" && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">Seu workspace</span>
                      <h1>
                        Configurações<span className="blue">.</span>
                      </h1>
                      <p>Preferências locais do ambiente demonstrativo.</p>
                    </div>
                  </div>
                  <section className="settings-panel">
                    <div>
                      <h2>Identificação demonstrativa</h2>
                      <p>
                        Esses dados não criam uma conta e não autenticam o
                        usuário.
                      </p>
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        try {
                          saveVerifyProfile(profile);
                          setSaved(true);
                          setNotice("Preferências salvas neste navegador.");
                        } catch {
                          setSaved(false);
                          setNotice(
                            "Não foi possível salvar as preferências neste navegador.",
                          );
                        }
                      }}
                    >
                      <label>
                        Nome de exibição
                        <input
                          value={profile.name}
                          onChange={(e) => {
                            setProfile({ ...profile, name: e.target.value });
                            setSaved(false);
                          }}
                        />
                      </label>
                      <label>
                        Workspace
                        <input
                          value={profile.workspace}
                          onChange={(e) => {
                            setProfile({
                              ...profile,
                              workspace: e.target.value,
                            });
                            setSaved(false);
                          }}
                        />
                      </label>
                      <Primary>
                        {saved ? "Salvar preferências" : "Salvar alterações"}
                        <Check size={16} />
                      </Primary>
                    </form>
                  </section>
                  <section className="settings-panel">
                    <div>
                      <h2>Dados do protótipo</h2>
                      <p>
                        Os projetos e seleções ficam neste navegador. Não há
                        integração com uma API de produção.
                      </p>
                    </div>
                    <div>
                      <button
                        className="outline"
                        onClick={() => {
                          const projectsSaved = persist(initialProjects);
                          setSessions([]);
                          setSelected("singulai");
                          try {
                            removeVerifySessions();
                            if (projectsSaved)
                              setNotice("Dados demonstrativos restaurados.");
                          } catch {
                            setNotice(
                              "Dados restaurados nesta sessão, mas o armazenamento local não pôde ser atualizado.",
                            );
                          }
                        }}
                      >
                        Restaurar dados demonstrativos
                      </button>
                    </div>
                  </section>
                </>
              )}
            </main>
            <footer className="app-footer">
              <span>RRV.digital / Engineering</span>
              <span className="mono">Objetivo → Evidência → Evolução</span>
              <span>Protótipo v1.0</span>
            </footer>
          </div>
        </div>
      )}
      {detail && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={"Detalhes " + detail.id}
            className="detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="section-title">
              <span className="mono blue">
                {detail.id} / {availableVersions[version]?.name || "v0.1"}
              </span>
              <button
                autoFocus
                className="icon-button"
                aria-label="Fechar detalhes"
                onClick={() => setDetail(null)}
              >
                <X size={20} />
              </button>
            </div>
            <h2>{detail.description}</h2>
            <Badge state={detail.results[version]} />
            <dl>
              <dt>Objetivo associado</dt>
              <dd>{detail.objective}</dd>
              <dt>Critério de aceite</dt>
              <dd>{detail.criterion}</dd>
              <dt>Método / Módulo</dt>
              <dd>
                {detail.method} · {detail.module}
              </dd>
              <dt>Evidência ilustrativa</dt>
              <dd>{detail.evidence}</dd>
              <dt>Observações</dt>
              <dd>{detail.note}</dd>
              <dt>Data demonstrativa</dt>
              <dd>{availableVersions[version]?.date || "Sem avaliação"}</dd>
            </dl>
            <h3>Histórico preservado</h3>
            <div className="modal-history">
              {availableVersions.map((v, i) => (
                <div key={v.name}>
                  <span className="mono">{v.name}</span>
                  <Badge state={detail.results[i]} />
                </div>
              ))}
            </div>
            <p className="footnote">
              Protótipo / Dados demonstrativos. Nenhuma avaliação real foi
              realizada.
            </p>
          </section>
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={18} />
          {notice}
          <button
            className="icon-button"
            aria-label="Fechar notificação"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
const steps = [
  "Identificação",
  "Mercado e segmento",
  "Tipo de projeto",
  "Funcionamento",
  "Procedimentos",
  "Objetivos",
  "Critérios de aceite",
  "Revisão",
];
function ProjectForm({
  onSave,
  onCancel,
}: {
  onSave: (p: Project) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState({
    name: "",
    description: "",
    url: "",
    owner: "",
    market: "",
    segment: "",
    audience: "",
    types: [] as string[],
    flows: "",
    procedures: "",
    objectives: "",
    criterion: "",
    requirement: "",
    method: "Inspeção manual",
    module: "M01",
  });
  const [error, setError] = useState("");
  const [approved, setApproved] = useState(false);
  const [additional, setAdditional] = useState<Requirement[]>([]);
  function makeRequirement(): Requirement {
    return {
      id: "REQ-" + String(additional.length + 1).padStart(2, "0"),
      description: d.requirement,
      criterion: d.criterion,
      objective: d.objectives,
      method: d.method,
      module: d.module,
      implemented: false,
      results: ["Não avaliado", "Não avaliado", "Não avaliado"],
      evidence: "Sem evidência associada.",
      note: "Requisito definido pelo cliente. Ainda não implementado nem avaliado.",
    };
  }
  function field(
    key: keyof typeof d,
    label: string,
    multiline = false,
    required = false,
  ) {
    return (
      <label>
        {label}
        {required && <span className="blue"> *</span>}
        {multiline ? (
          <textarea
            value={String(d[key])}
            onChange={(e) => setD({ ...d, [key]: e.target.value })}
            required={required}
            rows={4}
          />
        ) : (
          <input
            value={String(d[key])}
            onChange={(e) => setD({ ...d, [key]: e.target.value })}
            required={required}
            type={key === "url" ? "url" : "text"}
          />
        )}
      </label>
    );
  }
  function next() {
    const required = [
      ["name", "description", "owner"],
      ["market", "segment", "audience"],
      [],
      ["flows"],
      [],
      ["objectives"],
      ["criterion", "requirement", "method"],
      [],
    ][step];
    if (
      (step === 6 &&
      additional.length &&
      !d.requirement.trim() &&
      !d.criterion.trim()
        ? false
        : required.some((k) => !String(d[k as keyof typeof d]).trim())) ||
      (step === 2 && !d.types.length)
    ) {
      setError("Preencha os campos obrigatórios para continuar.");
      return;
    }
    if (step === 0 && d.url) {
      try {
        const u = new URL(d.url);
        if (!["https:", "http:"].includes(u.protocol)) throw Error();
      } catch {
        setError("Informe uma URL válida começando com https:// ou http://.");
        return;
      }
    }
    setError("");
    setStep(step + 1);
  }
  return (
    <>
      <button className="text-button back" onClick={onCancel}>
        <ArrowLeft size={15} />
        Meus projetos
      </button>
      <div className="page-heading">
        <div>
          <span className="eyebrow">O primeiro passo é definir</span>
          <h1>
            Um projeto.
            <br />O seu propósito<span className="blue">.</span>
          </h1>
          <p>
            Conte o que você quer construir. Vamos preservar esse ponto de
            partida.
          </p>
        </div>
        <span className="mono muted">
          {String(step + 1).padStart(2, "0")} / 08
        </span>
      </div>
      <div className="wizard">
        <aside>
          {steps.map((s, i) => (
            <div
              key={s}
              className={i === step ? "current" : i < step ? "done" : ""}
            >
              <span>
                {i < step ? (
                  <Check size={12} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              {s}
            </div>
          ))}
        </aside>
        <section className="wizard-form">
          <h2>{steps[step]}</h2>
          <p className="muted">
            {
              [
                "Uma apresentação clara do seu projeto.",
                "Para quem e em qual contexto o projeto existe?",
                "Selecione todas as classificações que se aplicam.",
                "Descreva o percurso principal de quem usa o projeto.",
                "Etapas operacionais, permissões e integrações esperadas.",
                "Qual problema o projeto pretende resolver?",
                "Registre um requisito e um critério que você aprova.",
                "Confira o escopo. Nada será acrescentado automaticamente.",
              ][step]
            }
          </p>
          {step === 0 && (
            <>
              {field("name", "Nome do projeto", false, true)}
              {field("description", "Descrição", true, true)}
              <div className="form-grid">
                {field("url", "URL (opcional)")}
                {field("owner", "Responsável", false, true)}
              </div>
            </>
          )}
          {step === 1 && (
            <>
              {field("market", "Mercado de atuação", false, true)}
              {field("segment", "Segmento", false, true)}
              {field("audience", "Público-alvo", true, true)}
            </>
          )}
          {step === 2 && (
            <div className="type-options">
              {[
                "Website",
                "Aplicação web",
                "Aplicativo mobile",
                "Sistema administrativo",
                "Plataforma de serviços",
                "E-commerce",
                "Inteligência artificial",
                "Automação",
                "Blockchain/Web3",
                "Outro",
              ].map((t) => (
                <label key={t}>
                  <input
                    type="checkbox"
                    checked={d.types.includes(t)}
                    onChange={() =>
                      setD({
                        ...d,
                        types: d.types.includes(t)
                          ? d.types.filter((x) => x !== t)
                          : [...d.types, t],
                      })
                    }
                  />
                  {t}
                </label>
              ))}
            </div>
          )}
          {step === 3 &&
            field(
              "flows",
              "Como funciona e quais são os principais fluxos?",
              true,
              true,
            )}
          {step === 4 &&
            field("procedures", "Procedimentos esperados (opcional)", true)}
          {step === 5 &&
            field("objectives", "Problema e resultados esperados", true, true)}
          {step === 6 && (
            <>
              {field("requirement", "Descrição do requisito", true, true)}
              {field("criterion", "Critério de aceite verificável", true, true)}
              {field("method", "Método de verificação", false, true)}
              <label>
                Módulo relacionado
                <select
                  value={d.module}
                  onChange={(e) => setD({ ...d, module: e.target.value })}
                >
                  {modules.map(([id, n]) => (
                    <option key={id} value={id}>
                      {id} · {n}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="outline"
                disabled={!d.requirement.trim() || !d.criterion.trim()}
                onClick={() => {
                  setAdditional([...additional, makeRequirement()]);
                  setD({ ...d, requirement: "", criterion: "" });
                }}
              >
                <Plus size={15} />
                Adicionar outro requisito
              </button>
              {additional.length > 0 && (
                <p className="footnote">
                  {additional.length} requisito(s) registrado(s). Preencha outro
                  ou continue.
                </p>
              )}
            </>
          )}
          {step === 7 && (
            <>
              {additional.map((r) => (
                <div className="review-extra" key={r.id}>
                  <strong>
                    {r.id} · {r.description}
                  </strong>
                  <p>Objetivo: {r.objective}</p>
                  <p>Critério: {r.criterion}</p>
                  <p>
                    Método: {r.method} · {r.module}
                  </p>
                </div>
              ))}
              <dl className="review">
                {Object.entries(d).map(([k, v]) => (
                  <div key={k}>
                    <dt>
                      {
                        {
                          name: "Projeto",
                          description: "Descrição",
                          url: "URL",
                          owner: "Responsável",
                          market: "Mercado",
                          segment: "Segmento",
                          audience: "Público",
                          types: "Classificações",
                          flows: "Funcionamento",
                          procedures: "Procedimentos",
                          objectives: "Objetivos",
                          criterion: "Critério de aceite",
                          requirement: "Requisito",
                          method: "Método",
                          module: "Módulo",
                        }[k]
                      }
                    </dt>
                    <dd>
                      {Array.isArray(v) ? v.join(", ") : v || "Não informado"}
                    </dd>
                  </div>
                ))}
              </dl>
              <label className="approve">
                <input
                  type="checkbox"
                  checked={approved}
                  onChange={(e) => setApproved(e.target.checked)}
                />
                Aprovo este escopo e o critério de aceite definido.
              </label>
            </>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="wizard-actions">
            <button
              className="text-button"
              onClick={() => (step ? setStep(step - 1) : onCancel())}
            >
              <ArrowLeft size={15} />
              {step ? "Anterior" : "Cancelar"}
            </button>
            {step < 7 ? (
              <Primary onClick={next}>
                Continuar <ArrowRight size={16} />
              </Primary>
            ) : (
              <Primary
                disabled={!approved}
                onClick={() =>
                  onSave({
                    id: "p-" + crypto.randomUUID(),
                    name: d.name.trim(),
                    description: d.description,
                    url: d.url,
                    owner: d.owner,
                    market: d.market,
                    segment: d.segment,
                    audience: d.audience,
                    types: d.types,
                    flows: d.flows,
                    procedures: d.procedures,
                    objectives: d.objectives,
                    modules: Array.from(
                      new Set([
                        ...additional.map((r) => r.module),
                        ...(d.requirement.trim() ? [d.module] : []),
                      ]),
                    ),
                    requirements: [
                      ...additional,
                      ...(d.requirement.trim() ? [makeRequirement()] : []),
                    ],
                  })
                }
              >
                Criar projeto <Check size={16} />
              </Primary>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
