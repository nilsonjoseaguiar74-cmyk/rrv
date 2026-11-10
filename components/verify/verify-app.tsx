"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
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
  type VerifyHistoryEntry,
  type VerifyProject,
  type VerifyExecution,
  type VerifyRequirement,
  type VerifySession,
  type VerifyValidation,
  type VerifyVersion,
  type VerifyWorkspace,
} from "@/domain/verify/data";
import {
  createVerifyProject,
  createVerifyRequirement,
  createVerifyValidation,
  createVerifyVersion,
  cancelVerifyExecution,
  getVerifyExecutions,
  getVerifyHistory,
  getVerifyProject,
  getVerifyRequirements,
  getVerifyValidations,
  getVerifyVersions,
  logoutVerifySession,
  startVerifyExecution,
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
        Cadastre seu primeiro projeto para começar a acompanhar sua evolução.
      </p>
      <Primary onClick={onCreate}>
        <Plus size={16} />
        Criar projeto
      </Primary>
    </section>
  );
}

function ResultList({
  requirements,
  validations = [],
}: {
  requirements: VerifyRequirement[];
  validations?: VerifyValidation[];
}) {
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
          <span className="mono muted">
            {(() => {
              const status = validations.find((item) => item.requirementId === requirement.id)?.status;
              return status
                ? { passed: "Aprovado", failed: "Reprovado", blocked: "Bloqueado" }[status]
                : "Sem resultado registrado";
            })()}
          </span>
        </article>
      ))}
    </div>
  );
}

function ValidationList({ items }: { items: VerifyValidation[] }) {
  if (!items.length) return <p className="footnote">Nenhum resultado manual registrado.</p>;
  return (
    <div className="validation-records">
      {items.map((item) => (
        <article className="validation-record" key={item.id}>
          <div className="validation-record-heading">
            <strong>{item.requirementDescription}</strong>
            <span className={`validation-status ${item.status}`}>{{
              passed: "Aprovado",
              failed: "Reprovado",
              blocked: "Bloqueado",
            }[item.status]}</span>
          </div>
          <small>{item.objective} · {item.versionLabel || "Sem versão associada"} · {new Date(item.createdAt).toLocaleString("pt-BR")}</small>
          <p>{item.summary}</p>
          <small>Critério de aceite: {item.acceptanceCriterion}</small>
          {item.evidence.map((evidence) => (
            <div className="validation-evidence" key={evidence.id}>
              <a href={evidence.url} target="_blank" rel="noreferrer">{evidence.title} <ArrowUpRight size={14} /></a>
              {evidence.notes && <p>{evidence.notes}</p>}
            </div>
          ))}
        </article>
      ))}
    </div>
  );
}

function ValidationForm({
  workspaceId,
  projectId,
  requirements,
  versions,
  onCreated,
}: {
  workspaceId: string;
  projectId: string;
  requirements: VerifyRequirement[];
  versions: VerifyVersion[];
  onCreated: (validation: VerifyValidation) => void;
}) {
  const [requirementId, setRequirementId] = useState(requirements[0]?.id || "");
  const [versionId, setVersionId] = useState("");
  const [status, setStatus] = useState<VerifyValidation["status"] | "">("");
  const [summary, setSummary] = useState("");
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!status || !requirementId) {
      setError("Selecione o requisito e o resultado informado.");
      return;
    }
    const hasEvidence = Boolean(evidenceTitle.trim() || evidenceUrl.trim() || evidenceNotes.trim());
    if (hasEvidence && (!evidenceTitle.trim() || !evidenceUrl.trim())) {
      setError("Para registrar evidência, informe o título e a URL HTTPS; a descrição não será descartada.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { item } = await createVerifyValidation(workspaceId, projectId, {
        requirementId,
        versionId,
        status,
        summary,
        ...(evidenceTitle.trim() && evidenceUrl.trim()
          ? { evidence: { title: evidenceTitle, url: evidenceUrl, notes: evidenceNotes } }
          : {}),
      });
      onCreated(item);
      setStatus("");
      setSummary("");
      setEvidenceTitle("");
      setEvidenceUrl("");
      setEvidenceNotes("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível registrar o resultado.");
    } finally {
      setSaving(false);
    }
  }

  if (!requirements.length) return null;
  return (
    <details className="custom-module" open>
      <summary>Registrar resultado e evidência</summary>
      <p>Registro manual informado pela equipe. O Verify não executa testes nem confirma os resultados.</p>
      <form onSubmit={submit}>
        <label>Requisito *
          <select required value={requirementId} onChange={(event) => setRequirementId(event.target.value)}>
            {requirements.map((item) => <option value={item.id} key={item.id}>{item.objective} · {item.description}</option>)}
          </select>
        </label>
        <label>Versão associada
          <select value={versionId} onChange={(event) => setVersionId(event.target.value)}>
            <option value="">Sem versão</option>
            {versions.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label>Resultado informado *
          <select required value={status} onChange={(event) => setStatus(event.target.value as VerifyValidation["status"] | "")}>
            <option value="">Selecione</option>
            <option value="passed">Aprovado</option>
            <option value="failed">Reprovado</option>
            <option value="blocked">Bloqueado</option>
          </select>
        </label>
        <label>Resumo / observação *
          <textarea required maxLength={10000} rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} />
        </label>
        <div className="form-grid">
          <label>Título da evidência
            <input maxLength={200} value={evidenceTitle} onChange={(event) => setEvidenceTitle(event.target.value)} />
          </label>
          <label>URL HTTPS da evidência
            <input type="url" maxLength={2048} placeholder="https://" value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} />
          </label>
        </div>
        <label>Descrição da evidência
          <textarea maxLength={10000} rows={2} value={evidenceNotes} onChange={(event) => setEvidenceNotes(event.target.value)} />
        </label>
        {error && <p className="verify-auth-error" role="alert">{error}</p>}
        <Primary type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar registro"}</Primary>
      </form>
    </details>
  );
}

function BrowserExecutionPanel({
  projectId,
  requirements,
  canWrite,
  onNotice,
  onExecutionsChange,
}: {
  projectId: string;
  requirements: VerifyRequirement[];
  canWrite: boolean;
  onNotice: (message: string) => void;
  onExecutionsChange: (executions: VerifyExecution[]) => void;
}) {
  const [executions, setExecutions] = useState<VerifyExecution[]>([]);
  const [requirementId, setRequirementId] = useState(requirements[0]?.id || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selectedRequirementId = requirements.some((item) => item.id === requirementId)
    ? requirementId
    : requirements[0]?.id || "";

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { items } = await getVerifyExecutions(projectId);
        if (active) {
          setExecutions(items);
          onExecutionsChange(items);
          setError("");
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "Não foi possível carregar as execuções.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    const timer = window.setInterval(() => {
      if (active) void load();
    }, 1500);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [onExecutionsChange, projectId]);

  async function start(testKey: VerifyExecution["testKey"]) {
    if (!selectedRequirementId) return;
    setSaving(true);
    setError("");
    try {
      const { item } = await startVerifyExecution(projectId, {
        requirementId: selectedRequirementId,
        testKey,
      });
      const next = [item, ...executions.filter((execution) => execution.id !== item.id)];
      setExecutions(next);
      onExecutionsChange(next);
      onNotice("Verificação enviada para a fila.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível iniciar o teste.");
    } finally {
      setSaving(false);
    }
  }

  async function cancel(executionId: string) {
    setError("");
    try {
      const { item } = await cancelVerifyExecution(executionId);
      const next = executions.map((execution) => execution.id === item.id ? item : execution);
      setExecutions(next);
      onExecutionsChange(next);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível cancelar a execução.");
    }
  }

  const labels: Record<VerifyExecution["status"], string> = {
    queued: "Na fila",
    running: "Executando",
    passed: "Concluído",
    failed: "Falhou",
    cancelled: "Cancelado",
  };
  const engineLabels: Record<VerifyExecution["testKey"], string> = {
    "local-page-smoke": "Playwright · Teste funcional",
    "local-lighthouse-audit": "Lighthouse · Qualidade da página",
    "local-axe-audit": "axe-core · Acessibilidade",
  };
  const categoryLabels: Record<string, string> = {
    performance: "Performance",
    accessibility: "Acessibilidade",
    "best-practices": "Boas práticas",
    seo: "SEO",
  };

  return (
    <section className="browser-execution-panel">
      <div className="section-title"><h2>Verificações automatizadas</h2></div>
      <p>Os motores analisam somente a fixture local controlada. A execução em endereços de projeto permanece bloqueada até haver isolamento de saída com allowlist e proteção contra SSRF; a API não aceita URL ou comando.</p>
      {canWrite && requirements.length > 0 && (
        <div className="browser-execution-controls">
          <label>Requisito associado
            <select value={selectedRequirementId} onChange={(event) => setRequirementId(event.target.value)}>
              {requirements.map((item) => <option value={item.id} key={item.id}>{item.objective} · {item.description}</option>)}
            </select>
          </label>
          <div className="browser-execution-actions">
            <Primary disabled={saving || !selectedRequirementId} onClick={() => void start("local-page-smoke")}>
              Playwright
            </Primary>
            <Primary disabled={saving || !selectedRequirementId} onClick={() => void start("local-lighthouse-audit")}>
              Lighthouse
            </Primary>
            <Primary disabled={saving || !selectedRequirementId} onClick={() => void start("local-axe-audit")}>
              axe-core
            </Primary>
            {saving && <span className="footnote" role="status">Enfileirando…</span>}
          </div>
        </div>
      )}
      {error && <p className="verify-auth-error" role="alert">{error}</p>}
      {loading ? <p className="footnote">Carregando execuções…</p> : executions.length === 0 ? (
        <p className="footnote">Nenhuma execução automatizada registrada.</p>
      ) : (
        <div className="validation-records">
          {executions.map((execution) => (
            <article className="validation-record" key={execution.id}>
              <div className="validation-record-heading">
                <strong>{engineLabels[execution.testKey]} · Chromium</strong>
                <span className={`validation-status ${execution.status === "passed" ? "passed" : execution.status === "failed" ? "failed" : execution.status === "cancelled" ? "blocked" : ""}`}>
                  {labels[execution.status]}
                </span>
              </div>
              <small>Execução {execution.id.slice(0, 8)} · {new Date(execution.createdAt).toLocaleString("pt-BR")}</small>
              {execution.results.map((result, resultIndex) => (
                <div key={`${execution.id}-result-${resultIndex}`} className="verify-engine-result">
                  {result.durationMs != null && <small>Duração: {(result.durationMs / 1000).toFixed(1)} s</small>}
                  {result.assertions?.map((assertion, index) => (
                    <p key={`${execution.id}-assertion-${index}`} role="status">
                      {assertion.passed ? "✓" : "✗"} {assertion.name}{assertion.message ? ` — ${assertion.message}` : ""}
                    </p>
                  ))}
                  {result.lighthouse && (
                    <div className="verify-lighthouse-result">
                      <p className="footnote">Lighthouse {result.lighthouse.version}. Escores são medições desta execução e variam com os recursos compartilhados do ambiente.</p>
                      <div className="verify-audit-categories">
                        {Object.entries(result.lighthouse.categories).map(([category, value]) => (
                          <div key={category}>
                            <span>{categoryLabels[category] || category}</span>
                            <strong>{value?.score == null ? "N/D" : `${Math.round(value.score * 100)}/100`}</strong>
                          </div>
                        ))}
                      </div>
                      <div className="verify-audit-metrics">
                        {result.lighthouse.metrics.map((metric) => (
                          <span key={metric.id}>
                            <strong>{metric.title}:</strong> {metric.displayValue || (metric.numericValue == null ? "N/D" : `${metric.numericValue} ${metric.numericUnit || ""}`)}
                          </span>
                        ))}
                      </div>
                      <details>
                        <summary>Relatório estruturado ({result.lighthouse.audits.length} auditorias)</summary>
                        <ul>
                          {result.lighthouse.audits.map((audit) => (
                            <li key={audit.id}>
                              <strong>{audit.title}</strong>
                              {audit.score != null && <> · {Math.round(audit.score * 100)}/100</>}
                              {audit.displayValue && <> · {audit.displayValue}</>}
                              <p>{audit.description}</p>
                              {audit.errorMessage && <p role="alert">{audit.errorMessage}</p>}
                            </li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  )}
                  {result.axe && (
                    <div className="verify-axe-result">
                      <p>
                        axe-core {result.axe.version}: {result.axe.violationsCount} violações, {result.axe.passesCount} regras aprovadas, {result.axe.incompleteCount} para revisão manual.
                      </p>
                      <p className="footnote">Análises automatizadas não certificam conformidade integral WCAG. Resultados incompletos exigem avaliação humana.</p>
                      {result.axe.violations.length === 0 ? (
                        <p>Nenhuma violação detectada pelas regras executadas.</p>
                      ) : (
                        <ul>
                          {result.axe.violations.map((violation) => (
                            <li key={violation.id}>
                              <strong>{violation.help}</strong> · impacto {violation.impact}
                              {violation.criteria.length > 0 && <p>Critérios WCAG relacionados: {violation.criteria.join(", ")}</p>}
                              <p>{violation.id} · {violation.nodes.length} elementos afetados</p>
                              <ul>
                                {violation.nodes.map((node, index) => (
                                  <li key={`${violation.id}-${index}`}>
                                    <code>{node.target.join(" ")}</code>
                                    {node.failureSummary && <p>{node.failureSummary}</p>}
                                  </li>
                                ))}
                              </ul>
                              <a href={violation.helpUrl} target="_blank" rel="noreferrer">Recomendação técnica do axe-core <ArrowUpRight size={14} /></a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {result.error && <p role="alert">{result.error}</p>}
                  {result.analysis && (
                    <section className="verify-analysis" aria-label="Interpretação local dos resultados">
                      <strong>Interpretação local · {result.analysis.model}</strong>
                      {result.analysis.status === "available" ? (
                        <>
                          <p>{result.analysis.summary}</p>
                          <p className="footnote">Síntese de IA local; confirme os resultados nas medições e evidências acima.</p>
                        </>
                      ) : (
                        <p className="footnote">{result.analysis.message}</p>
                      )}
                    </section>
                  )}
                </div>
              ))}
              {execution.errorMessage && <p role="alert">{execution.errorMessage}</p>}
              {execution.evidence && (
                <div className="validation-evidence">
                  <a href={execution.evidence.url} target="_blank" rel="noreferrer">Abrir screenshot PNG · {Math.ceil(execution.evidence.byteLength / 1024)} KB <ArrowUpRight size={14} /></a>
                  <small>SHA-256: {execution.evidence.sha256}</small>
                </div>
              )}
              {canWrite && ["queued", "running"].includes(execution.status) && (
                <button className="text-button" type="button" onClick={() => void cancel(execution.id)}>Cancelar execução</button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function AutomatedExecutionReport({ items }: { items: VerifyExecution[] }) {
  const engineLabels: Record<VerifyExecution["testKey"], string> = {
    "local-page-smoke": "Playwright · Teste funcional",
    "local-lighthouse-audit": "Lighthouse · Qualidade da página",
    "local-axe-audit": "axe-core · Acessibilidade",
  };
  const statusLabels: Record<VerifyExecution["status"], string> = {
    queued: "Na fila",
    running: "Executando",
    passed: "Concluído",
    failed: "Falhou",
    cancelled: "Cancelado",
  };
  if (!items.length) return <p className="footnote">Nenhuma execução automatizada persistida para este projeto.</p>;
  return (
    <div className="validation-records">
      {items.map((execution) => (
        <article className="validation-record" key={execution.id}>
          <div className="validation-record-heading">
            <strong>{engineLabels[execution.testKey]}</strong>
            <span className={`validation-status ${execution.status === "passed" ? "passed" : execution.status === "failed" ? "failed" : execution.status === "cancelled" ? "blocked" : ""}`}>
              {statusLabels[execution.status]}
            </span>
          </div>
          <small>{new Date(execution.createdAt).toLocaleString("pt-BR")} · requisito {execution.requirementId.slice(0, 8)}</small>
          {execution.results.map((result, index) => (
            <div className="verify-engine-result" key={`${execution.id}-${index}`}>
              {result.lighthouse && (
                <>
                  <p>
                    Lighthouse: {Object.entries(result.lighthouse.categories)
                      .map(([category, value]) => `${category} ${value?.score == null ? "N/D" : `${Math.round(value.score * 100)}/100`}`)
                      .join(" · ")}
                  </p>
                  <details>
                    <summary>Medições e auditorias ({result.lighthouse.audits.length})</summary>
                    <ul>
                      {result.lighthouse.metrics.map((metric) => (
                        <li key={metric.id}><strong>{metric.title}:</strong> {metric.displayValue || (metric.numericValue == null ? "N/D" : `${metric.numericValue} ${metric.numericUnit || ""}`)}</li>
                      ))}
                      {result.lighthouse.audits.map((audit) => (
                        <li key={audit.id}>
                          <strong>{audit.title}</strong>
                          {audit.score != null && <> · {Math.round(audit.score * 100)}/100</>}
                          {audit.displayValue && <> · {audit.displayValue}</>}
                          {audit.errorMessage && <p role="alert">{audit.errorMessage}</p>}
                        </li>
                      ))}
                    </ul>
                  </details>
                </>
              )}
              {result.axe && (
                <>
                  <p>axe-core: {result.axe.violationsCount} violações · {result.axe.passesCount} regras aprovadas · {result.axe.incompleteCount} para revisão manual</p>
                  {result.axe.violations.length > 0 && (
                    <details>
                      <summary>Violações encontradas ({result.axe.violations.length})</summary>
                      <ul>
                        {result.axe.violations.map((violation) => (
                          <li key={violation.id}>
                            <strong>{violation.help}</strong> · impacto {violation.impact}
                            {violation.criteria.length > 0 && <p>Critérios WCAG: {violation.criteria.join(", ")}</p>}
                            {violation.nodes.map((node, nodeIndex) => (
                              <p key={`${violation.id}-${nodeIndex}`}><code>{node.target.join(" ")}</code> {node.failureSummary}</p>
                            ))}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </>
              )}
              {result.assertions && (
                <details>
                  <summary>Asserções Playwright ({result.assertions.filter((assertion) => assertion.passed).length}/{result.assertions.length} aprovadas)</summary>
                  <ul>{result.assertions.map((assertion, assertionIndex) => <li key={`${execution.id}-${assertionIndex}`}>{assertion.passed ? "Aprovada" : "Falhou"} · {assertion.name}{assertion.message ? ` — ${assertion.message}` : ""}</li>)}</ul>
                </details>
              )}
              {result.analysis?.status === "available" ? (
                <p>{result.analysis.summary}</p>
              ) : result.analysis?.message ? <p className="footnote">{result.analysis.message}</p> : null}
            </div>
          ))}
          {execution.errorMessage && <p role="alert">{execution.errorMessage}</p>}
          {execution.evidence && (
            <div className="validation-evidence">
              <a href={execution.evidence.url} target="_blank" rel="noreferrer">Abrir evidência PNG · SHA-256 {execution.evidence.sha256.slice(0, 12)}… <ArrowUpRight size={14} /></a>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function VersionComparison({
  versions,
  validations,
}: {
  versions: VerifyVersion[];
  validations: VerifyValidation[];
}) {
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");
  if (versions.length < 2) {
    return <p className="footnote">Registre ao menos duas versões para comparar os resultados manuais associados a cada entrega.</p>;
  }
  const compare = (versionId: string) => {
    const records = validations.filter((item) => item.versionId === versionId);
    return {
      total: records.length,
      passed: records.filter((item) => item.status === "passed").length,
      failed: records.filter((item) => item.status === "failed").length,
      blocked: records.filter((item) => item.status === "blocked").length,
    };
  };
  const left = versions.find((item) => item.id === leftId);
  const right = versions.find((item) => item.id === rightId);
  return (
    <section className="version-comparison">
      <div className="section-title"><h2>Comparar registros por versão</h2></div>
      <p>Resumo de resultados manuais vinculados às versões selecionadas. Não compara código ou executa testes.</p>
      <div className="form-grid">
        <label>Versão A<select value={leftId} onChange={(event) => setLeftId(event.target.value)}><option value="">Selecione</option>{versions.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
        <label>Versão B<select value={rightId} onChange={(event) => setRightId(event.target.value)}><option value="">Selecione</option>{versions.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
      </div>
      {left && right && left.id !== right.id && (
        <div className="comparison-results">
          {[left, right].map((version) => {
            const counts = compare(version.id);
            return <article key={version.id}><strong>{version.label}</strong><span>{counts.total} registro(s)</span><small>Aprovados: {counts.passed} · Reprovados: {counts.failed} · Bloqueados: {counts.blocked}</small></article>;
          })}
        </div>
      )}
      {leftId && rightId && leftId === rightId && <p className="verify-auth-error" role="alert">Selecione duas versões diferentes.</p>}
    </section>
  );
}

function historyActionLabel(action: string) {
  return ({
    "project.created": "Projeto criado",
    "project.updated": "Projeto atualizado",
    "requirement.created": "Requisito cadastrado",
    "version.created": "Versão registrada",
    "validation.created": "Resultado manual registrado",
    "evidence.created": "Evidência registrada",
  } as Record<string, string>)[action] || action;
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
  const [validations, setValidations] = useState<VerifyValidation[]>([]);
  const [executionReports, setExecutionReports] = useState<VerifyExecution[]>([]);
  const [history, setHistory] = useState<VerifyHistoryEntry[]>([]);
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
      setValidations([]);
      setExecutionReports([]);
      setHistory([]);
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
      getVerifyValidations(activeProject.workspaceId, activeProject.id),
      getVerifyHistory(activeProject.workspaceId, activeProject.id),
      getVerifyExecutions(activeProject.id),
    ])
      .then(([projectResponse, requirementResponse, versionResponse, validationResponse, historyResponse, executionResponse]) => {
        if (!active) return;
        setLoadedProject(projectResponse.item);
        setRequirements(requirementResponse.items);
        setVersions(versionResponse.items);
        setValidations(validationResponse.items);
        setHistory(historyResponse.items);
        setExecutionReports(executionResponse.items);
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
      requirements: draft.requirements.map((requirement, index) => ({ ...requirement, sortOrder: index })),
    });
    const selectedWorkspace = session?.workspaces.find((entry) => entry.workspaceId === item.workspaceId);
    const project = {
      ...item,
      workspaceName: selectedWorkspace?.workspaceName,
      role: selectedWorkspace?.role,
    };
    updateProjects([project, ...projects]);
    setSelectedProjectId(project.id);
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
    const reportExecutions = executionReports.filter((execution) =>
      !moduleFilter || requirements.find((requirement) => requirement.id === execution.requirementId)?.moduleKey === moduleFilter,
    );
    const data = {
      project: loadedProject,
      requirements: rows,
      versions,
      validations,
      automatedExecutions: reportExecutions,
      history,
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
              <a className="outline" href="/start/verify/access">Entrar <ArrowUpRight size={16} /></a>
            </div>
          </header>
          <main>
            <section className="hero">
              <div className="hero-copy">
                <span className="eyebrow"><span className="tiny-cross">+</span> RRV.digital / Engineering</span>
                <h1>Seu projeto,<br />com escopo<br /><span>bem definido.</span></h1>
                <p>Registre objetivos, requisitos e critérios de aceite em um espaço privado ligado ao seu workspace.</p>
                <div className="hero-actions">
                  <a className="primary" href="/start/verify/access">Entrar <ArrowUpRight size={18} /></a>
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
              <a className="primary" href="/start/verify/access">Acessar Verify <ArrowUpRight size={18} /></a>
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
                <ResultList requirements={requirements} validations={validations} />
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
                <div className="page-heading"><div><span className="eyebrow">Registros vinculados a critérios</span><h1>Validações<span className="blue">.</span></h1><p>Resultados e evidências informados pela equipe, persistidos no workspace.</p></div></div>
                <div className="notice-panel"><ShieldCheck size={20} /><p><strong>Resultados manuais e automatizados.</strong> Registros manuais são declarações da equipe; o teste automatizado disponível executa apenas a página local controlada.</p></div>
                {!activeProject ? <EmptyProjects onCreate={() => navigate("projects/new")} /> : (
                  <>
                    <BrowserExecutionPanel key={activeProject.id} projectId={activeProject.id} requirements={requirements} canWrite={canWrite} onNotice={setNotice} onExecutionsChange={setExecutionReports} />
                    <ResultList requirements={requirements} validations={validations} />
                    {canWrite && <ValidationForm workspaceId={activeProject.workspaceId} projectId={activeProject.id} requirements={requirements} versions={versions} onCreated={(item) => { setValidations([item, ...validations]); setNotice("Resultado e evidência registrados."); }} />}
                    <div className="section-title spaced"><h2>Histórico de resultados</h2></div>
                    <ValidationList items={validations} />
                  </>
                )}
              </>
            )}
            {route === "evolution" && !detailLoading && !detailError && (
              <>
                <div className="page-heading"><div><span className="eyebrow">Entregas registradas</span><h1>Evolução<span className="blue">.</span></h1><p>Histórico de versões persistidas do projeto selecionado.</p></div></div>
                {!activeProject ? <EmptyProjects onCreate={() => navigate("projects/new")} /> : (
                  <>
                    {versions.length ? <div className="timeline-track">{versions.map((version) => <article className="milestone" key={version.id}><span className="mono">{version.deliveredAt || new Date(version.createdAt).toLocaleDateString("pt-BR")}</span><span className="track-line"><i /></span><strong>{version.label}</strong><span>{version.summary || "Sem resumo informado."}</span></article>)}</div> : <div className="empty"><GitBranch size={28} /><h2>Nenhuma versão cadastrada.</h2><p>As entregas registradas aparecerão aqui.</p></div>}
                    <VersionComparison versions={versions} validations={validations} />
                    <div className="section-title spaced"><h2>Histórico persistido</h2></div>
                    {history.length ? history.map((entry) => <article className="event" key={entry.id}><span className="event-dot" /><div><strong>{historyActionLabel(entry.action)}</strong><small>{entry.actorName || "Identidade removida"}</small></div><span className="mono">{new Date(entry.createdAt).toLocaleString("pt-BR")}</span></article>) : <p className="footnote">Nenhum evento registrado.</p>}
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
                    <ResultList requirements={requirements.filter((requirement) => !moduleFilter || requirement.moduleKey === moduleFilter)} validations={validations} />
                    <div className="section-title spaced"><h2>Relatórios automatizados</h2></div>
                    <AutomatedExecutionReport items={executionReports.filter((execution) =>
                      !moduleFilter || requirements.find((requirement) => requirement.id === execution.requirementId)?.moduleKey === moduleFilter,
                    )} />
                    <div className="section-title spaced"><h2>Resultados e evidências informados</h2></div>
                    <ValidationList items={validations.filter((item) => !moduleFilter || requirements.find((requirement) => requirement.id === item.requirementId)?.moduleKey === moduleFilter)} />
                    <div className="section-title spaced"><h2>Versões</h2></div>
                    {versions.length ? versions.map((version) => <article className="event" key={version.id}><span className="event-dot" /><div><strong>{version.label}</strong><small>{version.summary || "Sem resumo informado."}</small></div><span className="mono">{version.deliveredAt || new Date(version.createdAt).toLocaleDateString("pt-BR")}</span></article>) : <p className="footnote">Nenhuma versão cadastrada.</p>}
                    <div className="section-title spaced"><h2>Histórico de alterações</h2></div>
                    {history.length ? history.map((entry) => <article className="event" key={entry.id}><span className="event-dot" /><div><strong>{historyActionLabel(entry.action)}</strong><small>{entry.actorName || "Identidade removida"}</small></div><span className="mono">{new Date(entry.createdAt).toLocaleString("pt-BR")}</span></article>) : <p className="footnote">Nenhum evento registrado.</p>}
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
            {step === 7 && <div className="review-summary"><h3>{name}</h3><p>{description}</p><p>Workspace: {writableWorkspaces.find((workspace) => workspace.workspaceId === workspaceId)?.workspaceName}</p><p>Referência: {referenceUrl || "Não informada"}</p><p>{requirements.length} requisito(s) serão cadastrados.</p><ul>{requirements.map((requirement, index) => <li key={`${index}-${requirement.description}`}><strong>{requirement.objective}</strong><small>Requisito: {requirement.description}</small><small>Critério de aceite: {requirement.acceptanceCriterion}</small><small>Método: {requirement.verificationMethod || "Não definido"} · Módulo: {requirement.moduleKey || "Não definido"}</small></li>)}</ul></div>}
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
