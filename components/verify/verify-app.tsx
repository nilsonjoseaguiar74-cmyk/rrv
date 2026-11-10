"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Folder,
  GitBranch,
  LayoutDashboard,
  Layers,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import {
  modules,
  type VerifyProject,
  type VerifyRequirement,
  type VerifySession,
  type VerifyVersion,
  type VerifyWorkspace,
} from "@/domain/verify/data";
import {
  createVerifyProject,
  createVerifyRequirement,
  createVerifyVersion,
  getVerifyProject,
  getVerifyRequirements,
  getVerifyVersions,
  logoutVerifySession,
  updateVerifyProject,
} from "@/lib/verify/api";

const navigation = [
  ["dashboard", "Visão geral", LayoutDashboard],
  ["projects", "Meus projetos", Folder],
  ["modules", "Módulos", Layers],
  ["validations", "Validações", CheckCheck],
  ["evolution", "Evolução", GitBranch],
  ["reports", "Relatórios", FileText],
] as const;

type RequirementDraft = {
  objective: string;
  description: string;
  acceptanceCriterion: string;
  verificationMethod: string;
  moduleKey: string;
};

type ProjectDraft = {
  workspaceId: string;
  name: string;
  description: string;
  referenceUrl: string;
  requirements: RequirementDraft[];
};

function Brand() {
  return (
    <span className="brand">
      <span className="official-horizontal">
        <Image src="/brand/verify/rrv-horizontal.png" alt="RRV.digital" width={1672} height={941} />
      </span>
      <Image
        className="official-symbol"
        src="/brand/verify/rrv-symbol.png"
        alt="RRV.digital"
        width={1233}
        height={1275}
      />
      <span className="brand-divider" />
      <span className="verify-name">
        Verify<span className="brand-dot">.</span>
      </span>
    </span>
  );
}

function Primary({
  children,
  onClick,
  disabled = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button className="primary" onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  );
}

function EmptyProjects({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="empty" aria-labelledby="empty-projects-title">
      <Folder size={28} />
      <h2 id="empty-projects-title">Nenhum projeto cadastrado.</h2>
      <p>
        Cadastre seu primeiro projeto para acompanhar sua evolução, requisitos,
        entregas e validações.
      </p>
      <Primary onClick={onCreate}>
        <Plus size={16} />
        Criar projeto
      </Primary>
    </section>
  );
}

function ResultList({ requirements }: { requirements: VerifyRequirement[] }) {
  if (!requirements.length) {
    return (
      <div className="empty">
        <Target size={25} />
        <h3>Nenhum requisito cadastrado.</h3>
        <p>Adicione requisitos com critérios de aceite para este projeto.</p>
      </div>
    );
  }
  return (
    <div className="req-list">
      {requirements.map((requirement, index) => (
        <article className="req-row" key={requirement.id}>
          <span className="mono muted">{String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>{requirement.description}</strong>
            <small>
              {requirement.moduleKey || "Sem módulo"} ·{" "}
              {requirement.verificationMethod || "Método não definido"}
            </small>
          </div>
          <span className="mono muted">Sem resultado</span>
        </article>
      ))}
    </div>
  );
}

function AddRequirementForm({
  workspaceId,
  projectId,
  onCreated,
}: {
  workspaceId: string;
  projectId: string;
  onCreated: (requirement: VerifyRequirement) => void;
}) {
  const [values, setValues] = useState({
    objective: "",
    description: "",
    acceptanceCriterion: "",
    verificationMethod: "",
    moduleKey: "M01",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { item } = await createVerifyRequirement(workspaceId, projectId, {
        ...values,
        sortOrder: 0,
      });
      onCreated(item);
      setValues({
        objective: "",
        description: "",
        acceptanceCriterion: "",
        verificationMethod: "",
        moduleKey: "M01",
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar o requisito.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="custom-module">
      <summary>Adicionar requisito</summary>
      <form onSubmit={submit}>
        <label>
          Objetivo
          <input required maxLength={500} value={values.objective} onChange={(event) => setValues({ ...values, objective: event.target.value })} />
        </label>
        <label>
          Requisito
          <textarea required maxLength={10000} rows={3} value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} />
        </label>
        <label>
          Critério de aceite
          <textarea required maxLength={10000} rows={3} value={values.acceptanceCriterion} onChange={(event) => setValues({ ...values, acceptanceCriterion: event.target.value })} />
        </label>
        <div className="form-grid">
          <label>
            Método de verificação
            <input maxLength={160} value={values.verificationMethod} onChange={(event) => setValues({ ...values, verificationMethod: event.target.value })} />
          </label>
          <label>
            Módulo
            <select value={values.moduleKey} onChange={(event) => setValues({ ...values, moduleKey: event.target.value })}>
              {modules.map(([id, name]) => <option value={id} key={id}>{id} · {name}</option>)}
            </select>
          </label>
        </div>
        {error && <p className="verify-auth-error" role="alert">{error}</p>}
        <Primary disabled={saving} type="submit">{saving ? "Salvando…" : "Salvar requisito"}</Primary>
      </form>
    </details>
  );
}

function ProjectEditForm({
  project,
  onUpdated,
}: {
  project: VerifyProject;
  onUpdated: (project: VerifyProject) => void;
}) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [referenceUrl, setReferenceUrl] = useState(project.referenceUrl);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { item } = await updateVerifyProject(project.workspaceId, project.id, {
        name,
        description,
        referenceUrl,
      });
      onUpdated(item);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível atualizar o projeto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="custom-module">
      <summary>Editar informações do projeto</summary>
      <form onSubmit={submit}>
        <label>Nome do projeto *<input required maxLength={200} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Descrição<textarea maxLength={10000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label>URL de referência<input type="url" maxLength={2048} value={referenceUrl} onChange={(event) => setReferenceUrl(event.target.value)} /></label>
        {error && <p className="verify-auth-error" role="alert">{error}</p>}
        <Primary type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</Primary>
      </form>
    </details>
  );
}

export default function VerifyApp({
  session,
  projectsFromApi = [],
  onProjectsChange,
}: {
  session?: VerifySession;
  projectsFromApi?: VerifyProject[];
  onProjectsChange?: (projects: VerifyProject[]) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const route = pathname.replace(/^\/start\/verify\/?/, "") || "home";
  const projectRouteId =
    route.startsWith("projects/") && route !== "projects/new"
      ? route.slice("projects/".length)
      : "";
  const isProjectRoute = route.startsWith("projects/") && route !== "projects/new";
  const [projects, setProjects] = useState(projectsFromApi);
  const [selectedProjectId, setSelectedProjectId] = useState(projectRouteId || projectsFromApi[0]?.id || "");
  const [requirements, setRequirements] = useState<VerifyRequirement[]>([]);
  const [versions, setVersions] = useState<VerifyVersion[]>([]);
  const [loadedProject, setLoadedProject] = useState<VerifyProject | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("");
  const [mobile, setMobile] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [moduleFilter, setModuleFilter] = useState("");

  useEffect(() => {
    setProjects(projectsFromApi);
    if (projectRouteId) setSelectedProjectId(projectRouteId);
    else if (!projectsFromApi.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(projectsFromApi[0]?.id || "");
    }
  }, [projectsFromApi, projectRouteId, selectedProjectId]);

  const activeProjectId = projectRouteId || selectedProjectId;
  const activeProject = projects.find((project) => project.id === activeProjectId);
  const workspace = session?.workspaces.find(
    (item) => item.workspaceId === activeProject?.workspaceId,
  );
  const canWrite = Boolean(workspace && ["owner", "admin", "editor"].includes(workspace.role));
  const projectRecordsReady = loadedProject?.id === activeProjectId;
  const projectDataRoute =
    isProjectRoute || ["modules", "validations", "evolution", "reports"].includes(route);
  const filteredProjects = useMemo(
    () => projects.filter((project) => project.name.toLowerCase().includes(filter.toLowerCase())),
    [filter, projects],
  );

  useEffect(() => {
    if (!activeProject || !session) {
      setLoadedProject(null);
      setRequirements([]);
      setVersions([]);
      setDetailLoading(false);
      setDetailError("");
      return;
    }
    let active = true;
    setDetailLoading(true);
    setDetailError("");
    Promise.all([
      getVerifyProject(activeProject.workspaceId, activeProject.id),
      getVerifyRequirements(activeProject.workspaceId, activeProject.id),
      getVerifyVersions(activeProject.workspaceId, activeProject.id),
    ])
      .then(([projectResponse, requirementResponse, versionResponse]) => {
        if (!active) return;
        setLoadedProject(projectResponse.item);
        setRequirements(requirementResponse.items);
        setVersions(versionResponse.items);
      })
      .catch((error: unknown) => {
        if (active) {
          setDetailError(error instanceof Error ? error.message : "Não foi possível carregar o projeto.");
        }
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeProject, session]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function navigate(target: string) {
    router.push(target === "home" ? "/start/verify" : `/start/verify/${target}`);
    setMobile(false);
    setAccountOpen(false);
    window.scrollTo({ top: 0 });
  }

  function updateProjects(next: VerifyProject[]) {
    setProjects(next);
    onProjectsChange?.(next);
  }

  async function createProject(draft: ProjectDraft) {
    setPageError("");
    const { item } = await createVerifyProject({
      workspaceId: draft.workspaceId,
      name: draft.name,
      description: draft.description,
      referenceUrl: draft.referenceUrl,
    });
    const selectedWorkspace = session?.workspaces.find((entry) => entry.workspaceId === item.workspaceId);
    const project = {
      ...item,
      workspaceName: selectedWorkspace?.workspaceName,
      role: selectedWorkspace?.role,
    };
    updateProjects([project, ...projects]);
    setSelectedProjectId(project.id);

    let savedRequirements = 0;
    for (const [index, requirement] of draft.requirements.entries()) {
      try {
        await createVerifyRequirement(project.workspaceId, project.id, {
          ...requirement,
          sortOrder: index,
        });
        savedRequirements += 1;
      } catch (error) {
        setNotice(
          `Projeto criado. ${savedRequirements} de ${draft.requirements.length} requisitos foram salvos; o restante pode ser adicionado no projeto. ${error instanceof Error ? error.message : ""}`,
        );
        navigate(`projects/${project.id}`);
        return;
      }
    }
    setNotice("Projeto e requisitos salvos.");
    navigate(`projects/${project.id}`);
  }

  async function logout() {
    try {
      await logoutVerifySession();
      router.replace("/start/verify/access");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Não foi possível encerrar a sessão.");
    }
  }

  function exportReport() {
    if (!loadedProject) return;
    const rows = requirements.filter((requirement) => !moduleFilter || requirement.moduleKey === moduleFilter);
    const data = {
      project: loadedProject,
      requirements: rows,
      versions,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rrv-verify-${loadedProject.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Arquivo JSON dos registros atuais exportado.");
  }

  if (route === "home") {
    return (
      <div id="rrv-verify">
        <div className="landing">
          <header className="landing-nav">
            <Link href="/start/verify" aria-label="RRV Verify, início"><Brand /></Link>
            <div className="nav-links">
              <Link href="#metodo">Como funciona</Link>
              <Link href="#trajetoria">Acompanhamento</Link>
              <Link className="outline" href="/start/verify/access">Entrar <ArrowUpRight size={16} /></Link>
            </div>
          </header>
          <main>
            <section className="hero">
              <div className="hero-copy">
                <span className="eyebrow"><span className="tiny-cross">+</span> RRV.digital / Engineering</span>
                <h1>Seu projeto,<br />com escopo<br /><span>bem definido.</span></h1>
                <p>Registre objetivos, requisitos e critérios de aceite em um espaço privado ligado ao seu workspace.</p>
                <div className="hero-actions">
                  <Link className="primary" href="/start/verify/access">Entrar <ArrowUpRight size={18} /></Link>
                  <span className="mono muted">Projetos e requisitos<br />persistidos no workspace.</span>
                </div>
              </div>
              <div className="hero-art">
                <div className="art-grid">
                  <span className="eyebrow">Da definição ao acompanhamento</span>
                  <div className="art-flow">
                    {["Objetivo", "Requisito", "Critério", "Entrega"].map((item, index) => (
                      <div className="art-step" key={item}>
                        <span className="mono">0{index + 1}</span><strong>{item}</strong>
                        {index < 3 && <ArrowRight size={16} />}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="art-foot"><span><span className="tiny-square" /> Escopo registrado por você</span><span className="mono">RRV / VERIFY</span></div>
                <div className="art-floating"><ShieldCheck size={20} /><div><strong>Critérios claros.</strong><small>Controle de acesso por workspace.</small></div></div>
              </div>
            </section>
            <section className="principles" id="metodo">
              <div><span className="eyebrow">Um espaço para organizar entregas</span><h2>O combinado é o<br />ponto de partida.</h2></div>
              <div className="method">
                <span>Objetivo</span><ArrowRight /><span>Requisito</span><ArrowRight /><span>Critério</span><ArrowRight /><span>Entrega</span>
                <p>Defina o escopo do projeto e mantenha os registros associados ao seu workspace.</p>
              </div>
            </section>
            <section id="trajetoria" className="landing-end">
              <div><span className="eyebrow">Acesso privado</span><h2>Uma trajetória<br />organizada.</h2><p>Entre para cadastrar projetos e acompanhar os dados persistidos.</p></div>
              <Link className="primary" href="/start/verify/access">Acessar Verify <ArrowUpRight size={18} /></Link>
            </section>
          </main>
          <footer>
            <span className="official-portrait"><Image src="/brand/verify/rrv-vertical.png" alt="RRV.digital — marca oficial" width={1122} height={1402} loading="lazy" /></span>
            <span>Um produto RRV.digital</span><span className="mono">Engineering with purpose.</span>
          </footer>
        </div>
      </div>
    );
  }

  const pageTitle = route.startsWith("projects/")
    ? route === "projects/new" ? "Novo projeto" : loadedProject?.name || "Projeto"
    : navigation.find(([id]) => id === route)?.[1] || "Configurações";

  return (
    <div id="rrv-verify">
      <div className="app-shell">
        <aside className={mobile ? "sidebar open" : "sidebar"}>
          <button className="brand-link" onClick={() => navigate("home")} aria-label="Sobre o Verify"><Brand /></button>
          <button className="close-menu icon-button" aria-label="Fechar menu" onClick={() => setMobile(false)}><X /></button>
          <div className="workspace-label mono">WORKSPACE <span>{workspace?.workspaceName?.toUpperCase() || session?.workspaces[0]?.workspaceName.toUpperCase() || "SEM WORKSPACE"}</span></div>
          <nav>
            {navigation.map(([id, label, Icon]) => (
              <button key={id} onClick={() => navigate(id)} className={route === id || (id === "projects" && route.startsWith("projects/")) ? "active" : ""}>
                <Icon size={18} />{label}{id === "projects" && <span className="nav-count">{String(projects.length).padStart(2, "0")}</span>}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="scope-note"><ShieldCheck size={20} /><strong>Seu escopo é o guia.</strong><p>Os registros são organizados no workspace autorizado.</p></div>
            <button onClick={() => navigate("settings")} className={route === "settings" ? "active" : ""}><Settings size={18} />Configurações</button>
            <button onClick={() => navigate("home")}><ArrowUpRight size={18} />Sobre o Verify</button>
            <span className="mono sidebar-version">RRV VERIFY / BETA</span>
          </div>
        </aside>
        {mobile && <button className="backdrop" aria-label="Fechar navegação" onClick={() => setMobile(false)} />}
        <div className="app-main">
          <header className="topbar">
            <button className="mobile-menu icon-button" aria-label="Abrir navegação" onClick={() => setMobile(true)}><Menu size={20} /></button>
            <Image className="mobile-brand-icon" src="/brand/verify/rrv-symbol.png" alt="RRV.digital" width={24} height={25} />
            <span className="breadcrumb">Workspace <ChevronRight size={13} /><strong>{pageTitle}</strong></span>
            <div className="topbar-right">
              {projects.length > 0 && (
                <label className="project-select">
                  <span className="sr-only">Projeto selecionado</span><Folder size={14} />
                  <select
                    aria-label="Projeto selecionado"
                    value={activeProjectId}
                    onChange={(event) => {
                      setSelectedProjectId(event.target.value);
                      if (isProjectRoute) navigate(`projects/${event.target.value}`);
                    }}
                  >
                    {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                </label>
              )}
              <span className="top-separator" />
              <button aria-expanded={accountOpen} className="account" onClick={() => setAccountOpen(!accountOpen)}>
                <span>{session?.identity.name.slice(0, 2).toUpperCase()}</span><ChevronDown size={13} />
              </button>
              {accountOpen && (
                <div className="account-pop">
                  <strong>{session?.identity.name}</strong><p>{session?.identity.email}</p>
                  <button onClick={() => navigate("settings")}>Conta e workspace <Settings size={15} /></button>
                  <button onClick={logout}>Encerrar sessão <ArrowUpRight size={15} /></button>
                </div>
              )}
            </div>
          </header>
          <main className="content" key={route}>
            {pageError && <p className="verify-auth-error" role="alert">{pageError}</p>}
            {activeProject && projectDataRoute && detailLoading && <p role="status">Carregando os registros do projeto…</p>}
            {activeProject && projectDataRoute && detailError && <p className="verify-auth-error" role="alert">{detailError}</p>}
            {(route === "dashboard" || route === "projects") && (
              <>
                <div className="page-heading">
                  <div><span className="eyebrow">{route === "dashboard" ? "Workspace privado" : "Portfólio do workspace"}</span><h1>Seus projetos<span className="blue">.</span></h1><p>Objetivos, requisitos e entregas registrados no seu workspace.</p></div>
                  {session?.workspaces.some((item) => ["owner", "admin", "editor"].includes(item.role)) && <Primary onClick={() => navigate("projects/new")}><Plus size={17} />Novo projeto</Primary>}
                </div>
                <div className="metrics">
                  {[
                    [String(projects.length).padStart(2, "0"), "Projetos cadastrados", Folder],
                    [String(session?.workspaces.length || 0).padStart(2, "0"), "Workspaces acessíveis", Layers],
                    [activeProject ? projectRecordsReady ? String(requirements.length).padStart(2, "0") : "—" : "00", "Requisitos do projeto selecionado", Target],
                    [activeProject ? projectRecordsReady ? String(versions.length).padStart(2, "0") : "—" : "00", "Versões registradas", Clock],
                  ].map(([value, label, Icon]) => (
                    <div className="metric" key={String(label)}><div><span>{String(label)}</span><Icon size={17} /></div><strong>{String(value)}</strong><small>Dados persistidos</small></div>
                  ))}
                </div>
                {projects.length === 0 ? <EmptyProjects onCreate={() => navigate("projects/new")} /> : (
                  <>
                    <div className="section-title projects-heading">
                      <h2>Projetos do workspace <span className="muted small-text">/ {String(projects.length).padStart(2, "0")}</span></h2>
                      <label className="search"><Search size={16} /><input placeholder="Buscar projeto" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Buscar projeto" /></label>
                    </div>
                    <div className="projects-list">
                      {filteredProjects.map((project) => (
                        <div className="project-card" key={project.id}>
                          <div className="project-emblem"><Folder size={32} /></div>
                          <div className="project-main">
                            <div className="project-meta mono"><span>{project.workspaceName || "Workspace"}</span><span>{new Date(project.createdAt).toLocaleDateString("pt-BR")}</span></div>
                            <h2>{project.name}<ArrowUpRight size={21} /></h2><p>{project.description || "Sem descrição."}</p>
                            {project.referenceUrl && <a className="text-button" href={project.referenceUrl} target="_blank" rel="noreferrer">Abrir referência <ArrowUpRight size={14} /></a>}
                          </div>
                          <div className="project-summary">
                            <span className="mono muted">REGISTROS ATUAIS</span>
                            <span>Conteúdo e critérios cadastrados pelo workspace.</span>
                            <small>Atualizado: {new Date(project.updatedAt).toLocaleDateString("pt-BR")}</small>
                            <button className="outline" onClick={() => navigate(`projects/${project.id}`)}>Abrir projeto <ArrowRight size={16} /></button>
                          </div>
                        </div>
                      ))}
                      {filteredProjects.length === 0 && <div className="empty">Nenhum projeto encontrado.</div>}
                    </div>
                  </>
                )}
              </>
            )}
            {route === "projects/new" && (
              <ProjectForm
                workspaces={session?.workspaces || []}
                onCancel={() => navigate("projects")}
                onSave={createProject}
              />
            )}
            {isProjectRoute && (
              detailLoading ? <p role="status">Carregando os registros do projeto…</p> :
              detailError ? <section className="empty" role="alert"><Folder size={28} /><h1>Projeto indisponível.</h1><p>{detailError}</p><button className="outline" onClick={() => navigate("projects")}>Voltar aos projetos</button></section> :
              !activeProject || !loadedProject ? <section className="empty"><Folder size={28} /><h1>Projeto não encontrado.</h1><p>Este projeto não existe ou não pertence a um workspace autorizado.</p><button className="outline" onClick={() => navigate("projects")}>Voltar aos projetos</button></section> :
              <>
                <button className="text-button back" onClick={() => navigate("projects")}><ArrowLeft size={15} />Meus projetos</button>
                <div className="page-heading">
                  <div><span className="eyebrow">{workspace?.workspaceName || "Workspace"} / Projeto</span><h1>{loadedProject.name}<span className="blue">.</span></h1><p>{loadedProject.description || "Sem descrição."}</p></div>
                  {canWrite && <Primary onClick={() => navigate("validations")}>Ver validações disponíveis <ArrowUpRight size={17} /></Primary>}
                </div>
                <div className="project-info">
                  <div><span>Workspace</span><strong>{workspace?.workspaceName || "Workspace"}</strong></div>
                  <div><span>Referência</span><strong>{loadedProject.referenceUrl ? <a href={loadedProject.referenceUrl} target="_blank" rel="noreferrer">Abrir endereço</a> : "Não informada"}</strong></div>
                  <div><span>Criado em</span><strong>{new Date(loadedProject.createdAt).toLocaleDateString("pt-BR")}</strong></div>
                </div>
                {canWrite && <ProjectEditForm project={loadedProject} onUpdated={(item) => { setLoadedProject(item); updateProjects(projects.map((project) => project.id === item.id ? { ...project, ...item } : project)); setNotice("Projeto atualizado."); }} />}
                <div className="section-title spaced"><h2>Requisitos e critérios</h2><span className="mono muted">{requirements.length} REGISTROS</span></div>
                <ResultList requirements={requirements} />
                {canWrite && <AddRequirementForm workspaceId={loadedProject.workspaceId} projectId={loadedProject.id} onCreated={(requirement) => { setRequirements([...requirements, requirement]); setNotice("Requisito salvo no projeto."); }} />}
                <div className="section-title spaced"><h2>Versões</h2><button className="text-button" onClick={() => navigate("evolution")}>Ver evolução <ArrowUpRight size={15} /></button></div>
                {versions.length ? <div className="timeline-track">{versions.map((version) => <article className="milestone" key={version.id}><span className="mono">{version.deliveredAt || new Date(version.createdAt).toLocaleDateString("pt-BR")}</span><strong>{version.label}</strong><span>{version.summary || "Sem resumo informado."}</span></article>)}</div> : <p className="footnote">Nenhuma versão cadastrada.</p>}
              </>
            )}
            {route === "modules" && !detailLoading && !detailError && (
              <>
                <div className="page-heading"><div><span className="eyebrow">Classificação de requisitos</span><h1>Módulos<span className="blue">.</span></h1><p>Catálogo para organizar os requisitos registrados no seu projeto.</p></div></div>
                {!activeProject ? <EmptyProjects onCreate={() => navigate("projects/new")} /> : <div className="module-grid">
                  {modules.map(([id, name, description]) => {
                    const count = requirements.filter((requirement) => requirement.moduleKey === id).length;
                    return <article className="module" key={id}><div className="module-top"><span className="mono">{id}</span><span className="mono">{count}</span></div><h2>{name}</h2><p>{description}</p><div className="module-bottom"><span>{count} requisito(s) vinculado(s)</span><span>Catálogo</span></div></article>;
                  })}
                </div>}
                <p className="footnote">A seleção independente de módulos do projeto ainda não está disponível. Os vínculos exibidos vêm dos requisitos salvos.</p>
              </>
            )}
            {route === "validations" && !detailLoading && !detailError && (
              <>
                <div className="page-heading"><div><span className="eyebrow">Requisitos registrados</span><h1>Validações<span className="blue">.</span></h1><p>Consulte os critérios cadastrados para o projeto selecionado.</p></div></div>
                <div className="notice-panel"><ShieldCheck size={20} /><p><strong>Execução de verificações indisponível.</strong> Nenhum teste ou resultado é simulado ou registrado nesta área.</p></div>
                {!activeProject ? <EmptyProjects onCreate={() => navigate("projects/new")} /> : <ResultList requirements={requirements} />}
              </>
            )}
            {route === "evolution" && !detailLoading && !detailError && (
              <>
                <div className="page-heading"><div><span className="eyebrow">Entregas registradas</span><h1>Evolução<span className="blue">.</span></h1><p>Histórico de versões persistidas do projeto selecionado.</p></div></div>
                {!activeProject ? <EmptyProjects onCreate={() => navigate("projects/new")} /> : (
                  <>
                    {versions.length ? <div className="timeline-track">{versions.map((version) => <article className="milestone" key={version.id}><span className="mono">{version.deliveredAt || new Date(version.createdAt).toLocaleDateString("pt-BR")}</span><span className="track-line"><i /></span><strong>{version.label}</strong><span>{version.summary || "Sem resumo informado."}</span></article>)}</div> : <div className="empty"><GitBranch size={28} /><h2>Nenhuma versão cadastrada.</h2><p>As entregas registradas aparecerão aqui.</p></div>}
                    <p className="notice-panel"><Activity size={20} /><span>A comparação de resultados entre versões ainda não está disponível; não há snapshots de avaliações registrados.</span></p>
                    {canWrite && <VersionForm workspaceId={activeProject.workspaceId} projectId={activeProject.id} onCreated={(version) => { setVersions([version, ...versions]); setNotice("Versão registrada."); }} />}
                  </>
                )}
              </>
            )}
            {route === "reports" && !detailLoading && !detailError && (
              <>
                <div className="page-heading"><div><span className="eyebrow">Dados do projeto</span><h1>Relatórios<span className="blue">.</span></h1><p>Exporte os registros persistidos, sem resultados inferidos.</p></div>{loadedProject && <button className="outline" onClick={exportReport}><Download size={16} />Exportar JSON</button>}</div>
                {!activeProject ? <EmptyProjects onCreate={() => navigate("projects/new")} /> : (
                  <>
                    <div className="report-filters"><label>Módulo<select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}><option value="">Todos</option>{modules.map(([id, name]) => <option key={id} value={id}>{id} · {name}</option>)}</select></label></div>
                    <div className="report-intro"><div><span className="eyebrow">Registros atuais</span><h2>{loadedProject?.name || activeProject.name}</h2><p>{requirements.length} requisito(s) · {versions.length} versão(ões)</p></div><span className="mono">{workspace?.workspaceName}</span></div>
                    <ResultList requirements={requirements.filter((requirement) => !moduleFilter || requirement.moduleKey === moduleFilter)} />
                    <div className="section-title spaced"><h2>Versões</h2></div>
                    {versions.length ? versions.map((version) => <article className="event" key={version.id}><span className="event-dot" /><div><strong>{version.label}</strong><small>{version.summary || "Sem resumo informado."}</small></div><span className="mono">{version.deliveredAt || new Date(version.createdAt).toLocaleDateString("pt-BR")}</span></article>) : <p className="footnote">Nenhuma versão cadastrada.</p>}
                  </>
                )}
              </>
            )}
            {route === "settings" && (
              <>
                <div className="page-heading"><div><span className="eyebrow">Acesso e perfil</span><h1>Configurações<span className="blue">.</span></h1><p>Identidade e permissões da sessão autenticada.</p></div></div>
                <section className="settings-panel"><div><h2>Conta</h2><p>Identidade confirmada por código enviado ao e-mail cadastrado.</p></div><div><p><strong>{session?.identity.name}</strong></p><p>{session?.identity.email}</p><button className="outline" onClick={logout}>Encerrar sessão</button></div></section>
                <section className="settings-panel"><div><h2>Workspaces</h2><p>Acesso e permissões definidos pela RRV no convite.</p></div><ul className="verify-auth-workspaces">{session?.workspaces.map((item) => <li key={item.workspaceId}><strong>{item.workspaceName}</strong><span>{item.role}</span></li>)}</ul></section>
              </>
            )}
          </main>
          <footer className="app-footer"><span>RRV.digital / Engineering</span><span className="mono">Objetivo → Requisito → Entrega</span><span>RRV Verify</span></footer>
        </div>
      </div>
      {notice && <div className="toast" role="status"><Check size={18} />{notice}<button className="icon-button" aria-label="Fechar notificação" onClick={() => setNotice("")}><X size={16} /></button></div>}
    </div>
  );
}

const projectSteps = [
  "Identificação",
  "Referência e workspace",
  "Objetivo",
  "Requisito",
  "Critério de aceite",
  "Método e módulo",
  "Requisitos adicionais",
  "Revisão",
];

function ProjectForm({
  workspaces,
  onSave,
  onCancel,
}: {
  workspaces: VerifyWorkspace[];
  onSave: (draft: ProjectDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  const [workspaceId, setWorkspaceId] = useState(
    workspaces.find((workspace) => ["owner", "admin", "editor"].includes(workspace.role))?.workspaceId || "",
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [objective, setObjective] = useState("");
  const [requirementDescription, setRequirementDescription] = useState("");
  const [criterion, setCriterion] = useState("");
  const [method, setMethod] = useState("Inspeção manual");
  const [moduleKey, setModuleKey] = useState("M01");
  const [requirements, setRequirements] = useState<RequirementDraft[]>([]);
  const [nextDescription, setNextDescription] = useState("");
  const [nextCriterion, setNextCriterion] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const writableWorkspaces = workspaces.filter((workspace) => ["owner", "admin", "editor"].includes(workspace.role));
  const steps = projectSteps;

  function addRequirement(description = requirementDescription, acceptanceCriterion = criterion) {
    if (!objective.trim() || !description.trim() || !acceptanceCriterion.trim()) {
      setError("Preencha objetivo, requisito e critério antes de adicionar.");
      return;
    }
    setRequirements((current) => [...current, {
      objective: objective.trim(),
      description: description.trim(),
      acceptanceCriterion: acceptanceCriterion.trim(),
      verificationMethod: method.trim(),
      moduleKey,
    }]);
    setRequirementDescription("");
    setCriterion("");
    setNextDescription("");
    setNextCriterion("");
    setError("");
  }

  function next() {
    const invalid =
      (step === 0 && (!name.trim() || !description.trim())) ||
      (step === 1 && (!workspaceId || (referenceUrl && !/^https?:\/\//i.test(referenceUrl)))) ||
      (step === 2 && !objective.trim()) ||
      (step === 3 && !requirementDescription.trim()) ||
      (step === 4 && !criterion.trim()) ||
      (step === 5 && (!method.trim() || !moduleKey)) ||
      (step === 6 && requirements.length === 0);
    if (invalid) {
      setError(step === 6 ? "Adicione ao menos um requisito antes de continuar." : "Preencha os campos obrigatórios para continuar.");
      return;
    }
    if (step === 5 && requirements.length === 0) {
      setRequirements([{
        objective: objective.trim(),
        description: requirementDescription.trim(),
        acceptanceCriterion: criterion.trim(),
        verificationMethod: method.trim(),
        moduleKey,
      }]);
      setRequirementDescription("");
      setCriterion("");
    }
    setError("");
    setStep(Math.min(7, step + 1));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceId || !requirements.length) {
      setError("Escolha um workspace autorizado e adicione ao menos um requisito.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ workspaceId, name: name.trim(), description: description.trim(), referenceUrl: referenceUrl.trim(), requirements });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar o projeto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button className="text-button back" onClick={onCancel}><ArrowLeft size={15} />Meus projetos</button>
      <div className="page-heading"><div><span className="eyebrow">Cadastro persistente</span><h1>Um projeto.<br />O seu propósito<span className="blue">.</span></h1><p>As informações serão salvas no workspace escolhido.</p></div><span className="mono muted">{String(step + 1).padStart(2, "0")} / 08</span></div>
      {writableWorkspaces.length === 0 ? <section className="empty"><ShieldCheck size={28} /><h2>Permissão de cadastro indisponível.</h2><p>Solicite à RRV um convite com permissão para criar projetos.</p></section> : (
        <div className="wizard">
          <aside>{steps.map((label, index) => <div key={label} className={index === step ? "current" : index < step ? "done" : ""}><span>{index < step ? <Check size={12} /> : String(index + 1).padStart(2, "0")}</span>{label}</div>)}</aside>
          <form className="wizard-form" onSubmit={submit}>
            <h2>{steps[step]}</h2>
            <p className="muted">Cadastre somente informações que serão persistidas no Verify.</p>
            {step === 0 && <><label>Nome do projeto *<input required maxLength={200} value={name} onChange={(event) => setName(event.target.value)} /></label><label>Descrição *<textarea required maxLength={10000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} /></label></>}
            {step === 1 && <><label>Workspace autorizado *<select required value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)}>{writableWorkspaces.map((workspace) => <option key={workspace.workspaceId} value={workspace.workspaceId}>{workspace.workspaceName}</option>)}</select></label><label>URL de referência (opcional)<input type="url" maxLength={2048} placeholder="https://" value={referenceUrl} onChange={(event) => setReferenceUrl(event.target.value)} /></label></>}
            {step === 2 && <label>Objetivo do requisito *<textarea required maxLength={500} rows={4} value={objective} onChange={(event) => setObjective(event.target.value)} /></label>}
            {step === 3 && <label>Descrição do requisito *<textarea required maxLength={10000} rows={4} value={requirementDescription} onChange={(event) => setRequirementDescription(event.target.value)} /></label>}
            {step === 4 && <label>Critério de aceite *<textarea required maxLength={10000} rows={4} value={criterion} onChange={(event) => setCriterion(event.target.value)} /></label>}
            {step === 5 && <><label>Método de verificação<input maxLength={160} value={method} onChange={(event) => setMethod(event.target.value)} /></label><label>Módulo<select value={moduleKey} onChange={(event) => setModuleKey(event.target.value)}>{modules.map(([id, label]) => <option key={id} value={id}>{id} · {label}</option>)}</select></label></>}
            {step === 6 && <><p>Requisitos adicionados: {requirements.length}</p><div className="requirement-review">{requirements.map((item, index) => <article key={`${index}-${item.description}`}><strong>{item.description}</strong><small>{item.objective} · {item.moduleKey}</small></article>)}</div><label>Adicionar outro requisito<textarea maxLength={10000} rows={3} value={nextDescription} onChange={(event) => setNextDescription(event.target.value)} placeholder="Descrição" /></label><label>Critério de aceite<input maxLength={10000} value={nextCriterion} onChange={(event) => setNextCriterion(event.target.value)} /></label><button className="outline" type="button" disabled={!nextDescription.trim() || !nextCriterion.trim()} onClick={() => addRequirement(nextDescription, nextCriterion)}>Adicionar requisito</button></>}
            {step === 7 && <div className="review-summary"><h3>{name}</h3><p>{description}</p><p>Workspace: {writableWorkspaces.find((workspace) => workspace.workspaceId === workspaceId)?.workspaceName}</p><p>{requirements.length} requisito(s) serão cadastrados.</p><ul>{requirements.map((requirement, index) => <li key={`${index}-${requirement.description}`}>{requirement.description}<small>{requirement.acceptanceCriterion}</small></li>)}</ul></div>}
            {error && <p className="verify-auth-error" role="alert">{error}</p>}
            <div className="wizard-actions">
              {step > 0 && <button className="outline" type="button" onClick={() => { setError(""); setStep(step - 1); }}>Voltar</button>}
              {step < 7 ? <Primary type="button" onClick={next}>Continuar <ArrowRight size={16} /></Primary> : <Primary type="submit" disabled={saving}>{saving ? "Salvando…" : "Criar projeto"} <Check size={16} /></Primary>}
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function VersionForm({
  workspaceId,
  projectId,
  onCreated,
}: {
  workspaceId: string;
  projectId: string;
  onCreated: (version: VerifyVersion) => void;
}) {
  const [label, setLabel] = useState("");
  const [summary, setSummary] = useState("");
  const [deliveredAt, setDeliveredAt] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { item } = await createVerifyVersion(workspaceId, projectId, { label, summary, deliveredAt });
      onCreated(item);
      setLabel("");
      setSummary("");
      setDeliveredAt("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível registrar a versão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="custom-module">
      <summary>Registrar versão</summary>
      <form onSubmit={submit}>
        <label>Identificação da versão *<input required maxLength={80} value={label} onChange={(event) => setLabel(event.target.value)} /></label>
        <label>Resumo<input maxLength={10000} value={summary} onChange={(event) => setSummary(event.target.value)} /></label>
        <label>Data de entrega<input type="date" value={deliveredAt} onChange={(event) => setDeliveredAt(event.target.value)} /></label>
        {error && <p className="verify-auth-error" role="alert">{error}</p>}
        <Primary type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar versão"}</Primary>
      </form>
    </details>
  );
}
