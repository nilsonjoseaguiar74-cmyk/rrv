"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAdminSession } from "@/components/admin/AdminSessionShell";

type Section = "dashboard" | "home" | "services" | "projects" | "team" | "ctas" | "leads" | "settings";
type Item = Record<string, unknown> & { id?: number | string };
type Field = { key: string; label: string; type?: "text" | "textarea" | "number" | "url" | "select" | "checkbox"; options?: string[]; wide?: boolean };

const sectionMeta: Record<Section, [string, string]> = {
  dashboard: ["Visão geral", "Controle editorial, comercial e operacional em uma única superfície."],
  home: ["Home", "Edite a mensagem principal, salve como rascunho, visualize e publique sem alterar código."],
  services: ["Serviços", "Organize capacidades por disciplina, ordem e estado editorial."],
  projects: ["Projetos", "Gerencie cases, imagens, tecnologias, destaques e publicação."],
  team: ["Equipe", "Controle perfis, funções, biografias, links e visibilidade."],
  ctas: ["CTAs", "Defina mensagens e destinos por contexto da experiência pública."],
  leads: ["Leads", "Acompanhe cada oportunidade do primeiro contato ao resultado."],
  settings: ["Configurações", "Ajuste os textos comerciais da página Start e parâmetros editoriais."],
};

const fields: Partial<Record<Section, Field[]>> = {
  services: [
    { key: "name", label: "Nome" }, { key: "slug", label: "Slug" }, { key: "category", label: "Categoria", type: "select", options: ["growth", "experience", "engineering"] },
    { key: "cta", label: "CTA" }, { key: "description", label: "Descrição", type: "textarea", wide: true }, { key: "icon", label: "Ícone / referência" },
    { key: "sortOrder", label: "Ordem", type: "number" }, { key: "isActive", label: "Ativo", type: "checkbox" },
  ],
  projects: [
    { key: "title", label: "Título" }, { key: "slug", label: "Slug" }, { key: "category", label: "Categoria", type: "select", options: ["growth", "experience", "engineering"] },
    { key: "imageUrl", label: "Imagem", type: "url" }, { key: "projectUrl", label: "URL do projeto", type: "url" }, { key: "technologies", label: "Tecnologias" },
    { key: "description", label: "Descrição", type: "textarea", wide: true }, { key: "sortOrder", label: "Ordem", type: "number" },
    { key: "featured", label: "Destaque", type: "checkbox" }, { key: "isActive", label: "Ativo", type: "checkbox" },
  ],
  team: [
    { key: "name", label: "Nome" }, { key: "role", label: "Cargo" }, { key: "slug", label: "Slug" },
    { key: "discipline", label: "Disciplina", type: "select", options: ["growth", "experience", "engineering"] }, { key: "imageUrl", label: "Imagem", type: "url" }, { key: "linkedinUrl", label: "LinkedIn", type: "url" },
    { key: "biography", label: "Biografia / foco", type: "textarea", wide: true }, { key: "sortOrder", label: "Ordem", type: "number" }, { key: "isActive", label: "Visível", type: "checkbox" },
  ],
  ctas: [
    { key: "title", label: "Mensagem" }, { key: "label", label: "Texto do botão" }, { key: "slug", label: "Slug" },
    { key: "url", label: "Destino", type: "url" }, { key: "context", label: "Contexto", type: "select", options: ["neutral", "growth", "experience", "engineering", "convergence"] },
    { key: "sortOrder", label: "Ordem", type: "number" }, { key: "isActive", label: "Ativo", type: "checkbox" },
  ],
};

const homeFields: Field[] = [
  { key: "home_eyebrow", label: "Identificação" }, { key: "home_headline", label: "Headline — separe as linhas com |", wide: true },
  { key: "home_subtitle", label: "Subtítulo", type: "textarea", wide: true }, { key: "home_primary_cta", label: "CTA principal" }, { key: "home_secondary_cta", label: "CTA secundário" },
];

const settingFields: Field[] = [
  { key: "company_name", label: "Nome da empresa" }, { key: "commercial_email", label: "E-mail comercial" }, { key: "whatsapp", label: "WhatsApp" },
  { key: "default_cta", label: "CTA padrão" }, { key: "social_links", label: "Links sociais (JSON)", type: "textarea", wide: true }, { key: "footer_info", label: "Informações do rodapé", type: "textarea", wide: true },
  { key: "start_offer_title", label: "Título da oferta" }, { key: "start_starting_price", label: "Preço inicial" }, { key: "start_primary_cta", label: "CTA da página Start" },
];

function valueFromForm(form: HTMLFormElement, field: Field) {
  const element = form.elements.namedItem(field.key) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
  if (!element) return "";
  return field.type === "checkbox" ? (element as HTMLInputElement).checked : element.value;
}

export function AdminWorkspace({ section }: { section: Section }) {
  const role = useAdminSession()?.role || "viewer";
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [editing, setEditing] = useState<Item | null>(null);
  const writable = role !== "viewer";
  const [title, description] = sectionMeta[section];

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/${section}`, { cache: "no-store" });
      const payload = await response.json() as Record<string, unknown> & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Não foi possível carregar o módulo.");
      setData(payload);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Falha ao carregar.");
    } finally { setLoading(false); }
  }, [section]);

  useEffect(() => {
    // The request synchronizes the workspace with server-authoritative CMS data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const settings = useMemo(() => Object.fromEntries(((data.settings || []) as Item[]).map((item) => [String(item.key), String(item.value ?? "")])), [data.settings]);

  async function saveSettings(event: FormEvent<HTMLFormElement>, publish: boolean) {
    event.preventDefault();
    if (!writable) return;
    const form = event.currentTarget;
    const activeFields = section === "home" ? homeFields : settingFields;
    const values = Object.fromEntries(activeFields.map((field) => [field.key, valueFromForm(form, field)]));
    await mutate(`/api/admin/${section}`, { method: "PUT", body: JSON.stringify({ values, publish }) }, publish ? "Conteúdo publicado." : "Rascunho salvo.");
  }

  async function saveCollection(event: FormEvent<HTMLFormElement>, status: "draft" | "published") {
    event.preventDefault();
    if (!writable) return;
    const form = event.currentTarget;
    const activeFields = fields[section] || [];
    const payload = Object.fromEntries(activeFields.map((field) => [field.key, valueFromForm(form, field)]));
    await mutate(`/api/admin/${section}`, { method: "POST", body: JSON.stringify({ ...payload, id: editing?.id, status }) }, status === "published" ? "Registro publicado." : "Rascunho salvo.");
    setEditing(null);
  }

  async function saveHomeSections(sections: Item[]) {
    if (!writable) return;
    await mutate("/api/admin/home", { method: "POST", body: JSON.stringify({ sections, publish: true }) }, "Ordem e visibilidade publicadas.");
  }

  async function mutate(url: string, init: RequestInit, success: string) {
    setFeedback("Salvando…");
    try {
      const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init.headers || {}) } });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Não foi possível concluir.");
      setFeedback(success);
      await load();
    } catch (error) { setFeedback(error instanceof Error ? error.message : "Falha na operação."); }
  }

  async function archive(id: number | string) {
    if (!confirm("Arquivar este registro? Ele deixará de aparecer no site público.")) return;
    await mutate(`/api/admin/${section}/${id}`, { method: "DELETE" }, "Registro arquivado.");
  }

  if (loading) return <div className="admin-page"><p className="admin-loading">Carregando módulo…</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-head"><div><span>CMS / {section}</span><h1>{title}.</h1></div><p>{description}</p></div>
      {feedback && <div className="admin-feedback" role="status">{feedback}</div>}
      {section === "dashboard" && <Dashboard data={data} />}
      {(section === "home" || section === "settings") && <SettingsEditor fields={section === "home" ? homeFields : settingFields} values={settings} writable={writable} onSubmit={saveSettings} />}
      {section === "home" && <HomeSectionManager items={(data.sections || []) as Item[]} writable={writable} onSave={saveHomeSections} />}
      {fields[section] && <CollectionEditor section={section} fields={fields[section] || []} items={(data.items || []) as Item[]} editing={editing} writable={writable} onEdit={setEditing} onCancel={() => setEditing(null)} onSubmit={saveCollection} onArchive={archive} />}
      {section === "leads" && <LeadBoard items={(data.items || []) as Item[]} writable={writable && (role === "admin" || role === "owner")} onStatus={(id, status, notes) => mutate(`/api/admin/leads/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, notes }) }, notes === undefined ? "Status do lead atualizado." : "Observação registrada.")} />}
    </div>
  );
}

function Dashboard({ data }: { data: Record<string, unknown> }) {
  const stats = (data.stats || {}) as Record<string, number>;
  const cards = [["Leads novos", stats.newLeads], ["Leads no mês", stats.monthLeads], ["Projetos publicados", stats.published], ["Serviços ativos", stats.services], ["Equipe visível", stats.team]];
  return <><section className="admin-stat-grid">{cards.map(([label, value]) => <article key={String(label)}><span>{label}</span><strong>{String(value ?? 0).padStart(2, "0")}</strong></article>)}</section><section className="admin-audit"><h2>Atividade recente</h2>{((data.audit || []) as Item[]).map((entry, index) => <div key={index}><span>{String(entry.createdAt || "")}</span><strong>{String(entry.action || "")}</strong><span>{String(entry.entityType || "")} / {String(entry.entityId || "")}</span><small>{String(entry.actorEmail || "")}</small></div>)}</section></>;
}

function SettingsEditor({ fields, values, writable, onSubmit }: { fields: Field[]; values: Record<string, string>; writable: boolean; onSubmit: (event: FormEvent<HTMLFormElement>, publish: boolean) => void }) {
  return <form className="admin-editor" onSubmit={(event) => onSubmit(event, true)}><div className="admin-form-grid">{fields.map((field) => <EditorField key={field.key} field={field} value={values[field.key] || ""} />)}</div><div className="admin-editor-actions"><a href="/" target="_blank">Visualizar site ↗</a><div><button type="button" disabled={!writable} onClick={(event) => onSubmit({ ...event, currentTarget: event.currentTarget.form } as unknown as FormEvent<HTMLFormElement>, false)}>Salvar rascunho</button><button className="is-primary" disabled={!writable} type="submit">Publicar</button></div></div></form>;
}

function HomeSectionManager({ items, writable, onSave }: { items: Item[]; writable: boolean; onSave: (items: Item[]) => void }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const updates = items.map((item) => ({
      id: item.id,
      isActive: (form.elements.namedItem(`active-${item.id}`) as HTMLInputElement | null)?.checked ?? false,
      sortOrder: Number((form.elements.namedItem(`order-${item.id}`) as HTMLInputElement | null)?.value || 0),
    }));
    void onSave(updates);
  }
  return <form className="admin-section-manager" onSubmit={submit}><div><span>Controle de seções</span><h2>Ordem e visibilidade.</h2></div><div className="admin-section-list">{items.map((item) => <label key={String(item.id)}><input type="checkbox" name={`active-${item.id}`} defaultChecked={item.isActive === true || item.isActive === 1}/><strong>{String(item.title)}</strong><span>{String(item.slug)}</span><input aria-label={`Ordem de ${String(item.title)}`} type="number" min="1" name={`order-${item.id}`} defaultValue={Number(item.sortOrder) || 0}/></label>)}</div><button disabled={!writable} type="submit">Publicar organização</button></form>;
}

function CollectionEditor({ section, fields, items, editing, writable, onEdit, onCancel, onSubmit, onArchive }: { section: Section; fields: Field[]; items: Item[]; editing: Item | null; writable: boolean; onEdit: (item: Item) => void; onCancel: () => void; onSubmit: (event: FormEvent<HTMLFormElement>, status: "draft" | "published") => void; onArchive: (id: number | string) => void }) {
  return <><form className="admin-editor" key={editing?.id || "new"} onSubmit={(event) => onSubmit(event, "published")}><div className="admin-editor-title"><span>{editing ? `Editando #${editing.id}` : "Novo registro"}</span>{editing && <button type="button" onClick={onCancel}>Cancelar edição</button>}</div><div className="admin-form-grid">{fields.map((field) => <EditorField key={field.key} field={field} value={editing?.[field.key]} />)}</div><div className="admin-editor-actions"><span>{section === "projects" ? "A imagem pode usar um caminho interno ou URL HTTPS." : "Alterações publicadas atualizam a camada pública."}</span><div><button type="button" disabled={!writable} onClick={(event) => onSubmit({ ...event, currentTarget: event.currentTarget.form } as unknown as FormEvent<HTMLFormElement>, "draft")}>Salvar rascunho</button><button className="is-primary" disabled={!writable} type="submit">Publicar</button></div></div></form><div className="admin-records">{items.map((item) => <article key={String(item.id)}><div><span>#{item.id} · {String(item.status || "")}</span><strong>{String(item.title || item.name || item.label || "Sem título")}</strong><small>{String(item.category || item.discipline || item.context || item.updatedAt || "")}</small></div><div><button onClick={() => onEdit(item)}>Editar</button><button className="is-danger" onClick={() => onArchive(item.id || "")}>Arquivar</button></div></article>)}</div></>;
}

function EditorField({ field, value }: { field: Field; value: unknown }) {
  const className = field.wide ? "admin-field is-wide" : "admin-field";
  if (field.type === "textarea") return <label className={className}><span>{field.label}</span><textarea name={field.key} rows={4} defaultValue={String(value ?? "")} /></label>;
  if (field.type === "select") return <label className={className}><span>{field.label}</span><select name={field.key} defaultValue={String(value || field.options?.[0] || "")}>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
  if (field.type === "checkbox") return <label className={`${className} is-check`}><input name={field.key} type="checkbox" defaultChecked={value === undefined ? true : value === true || value === 1} /><span>{field.label}</span></label>;
  return <label className={className}><span>{field.label}</span><input name={field.key} type={field.type || "text"} defaultValue={String(value ?? "")} /></label>;
}

function LeadBoard({ items, writable, onStatus }: { items: Item[]; writable: boolean; onStatus: (id: number | string, status: string, notes?: string) => void }) {
  const [search,setSearch]=useState(""); const [filter,setFilter]=useState("all");
  const statuses = [["new", "Novo"], ["contacted", "Contatado"], ["qualified", "Qualificado"], ["proposal", "Proposta"], ["won", "Ganho"], ["lost", "Perdido"], ["spam", "Spam"]];
  const visible=items.filter(lead=>(filter==="all"||lead.status===filter)&&[lead.name,lead.email,lead.whatsapp,lead.company].some(value=>String(value||"").toLowerCase().includes(search.toLowerCase())));
  return <><div className="admin-lead-filters"><input aria-label="Buscar leads" placeholder="Buscar nome, empresa, e-mail ou WhatsApp" value={search} onChange={event=>setSearch(event.target.value)}/><select aria-label="Filtrar por status" value={filter} onChange={event=>setFilter(event.target.value)}><option value="all">Todos os status</option>{statuses.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div><div className="admin-leads">{visible.map((lead) => <article key={String(lead.id)}><div className="admin-lead-head"><span>#{lead.id} · {String(lead.createdAt || "")}</span><strong>{String(lead.name || "")}</strong><small>{String(lead.company || lead.projectType || "")}</small></div><p>{String(lead.description || "")}</p><div className="admin-lead-contact"><a href={`mailto:${String(lead.email || "")}`}>{String(lead.email || "")}</a><a href={`https://wa.me/${String(lead.whatsapp || "").replace(/\D/g, "")}`} target="_blank">{String(lead.whatsapp || "")}</a><span>{String(lead.budget || "")}</span></div>{Boolean(lead.notes)&&<small>{String(lead.notes)}</small>}<select disabled={!writable} value={String(lead.status || "new")} onChange={(event) => onStatus(lead.id || "", event.target.value)}>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{writable&&<button type="button" onClick={()=>{const notes=window.prompt("Observação sobre este lead:",String(lead.notes||""));if(notes!==null)onStatus(lead.id || "",String(lead.status||"new"),notes)}}>Registrar observação</button>}</article>)}</div></>;
}
