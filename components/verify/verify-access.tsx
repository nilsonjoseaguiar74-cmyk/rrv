"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getVerifySession, VerifyApiError } from "@/lib/verify/api";

function VerifyAccessShell({ children }: { children: React.ReactNode }) {
  return (
    <div id="rrv-verify">
      <main className="verify-auth">
        <Link className="verify-auth-brand" href="/start/verify">
          RRV.digital <span>/ Verify</span>
        </Link>
        {children}
        <p className="verify-auth-note">
          Acesso ao Beta mediante aprovação da equipe RRV.
        </p>
      </main>
    </div>
  );
}

export function VerifyInviteForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [codeRequested, setCodeRequested] = useState(false);
  const [requestMode, setRequestMode] = useState(false);
  const [requestName, setRequestName] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [companyOrProject, setCompanyOrProject] = useState("");
  const [interest, setInterest] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/verify/auth/request-code", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Não foi possível solicitar um código.");
      }
      setCodeRequested(true);
      setMessage("Se este e-mail estiver cadastrado e houver convite válido, enviaremos um código temporário.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível solicitar um código.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/verify/auth/verify-code", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, name }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Código inválido ou expirado.");
      }
      router.replace("/start/verify/dashboard");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível confirmar o código.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function submitAccessRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestSubmitting(true);
    setRequestMessage("");
    try {
      const response = await fetch("/api/verify/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: requestName, email: requestEmail, companyOrProject, interest }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Não foi possível enviar a solicitação.");
      setRequestSubmitted(true);
      setRequestMessage(payload.message || "Solicitação recebida para análise da equipe RRV.");
    } catch (error) {
      setRequestMessage(
        error instanceof Error ? error.message : "Não foi possível enviar a solicitação.",
      );
    } finally {
      setRequestSubmitting(false);
    }
  }

  return (
    <VerifyAccessShell>
      <section className="verify-auth-panel" aria-labelledby="verify-invite-title">
        {requestMode ? (
          <>
            <span className="eyebrow">Participação no Beta</span>
            <h1 id="verify-invite-title">
              {requestSubmitted ? "Solicitação recebida." : "Solicite acesso ao Beta."}
            </h1>
            {requestSubmitted ? (
              <>
                <p role="status">{requestMessage}</p>
                <p>
                  Seus dados serão usados somente para avaliar esta solicitação e
                  organizar o acesso ao RRV Verify.
                </p>
                <button
                  className="outline"
                  onClick={() => {
                    setRequestMode(false);
                    setRequestSubmitted(false);
                    setRequestMessage("");
                  }}
                  type="button"
                >
                  Voltar para entrar
                </button>
              </>
            ) : (
              <>
                <p>
                  Conte um pouco sobre seu projeto. A equipe RRV analisará o
                  pedido; o acesso só é liberado após aprovação e convite.
                </p>
                <form onSubmit={submitAccessRequest}>
                  <label>
                    Nome
                    <input
                      autoComplete="name"
                      maxLength={160}
                      minLength={2}
                      required
                      value={requestName}
                      onChange={(event) => setRequestName(event.target.value)}
                    />
                  </label>
                  <label>
                    E-mail
                    <input
                      autoComplete="email"
                      maxLength={320}
                      required
                      type="email"
                      value={requestEmail}
                      onChange={(event) => setRequestEmail(event.target.value)}
                    />
                  </label>
                  <label>
                    Empresa ou projeto
                    <input
                      maxLength={160}
                      minLength={2}
                      required
                      value={companyOrProject}
                      onChange={(event) => setCompanyOrProject(event.target.value)}
                    />
                  </label>
                  <label>
                    Como pretende usar o Verify?
                    <textarea
                      maxLength={1200}
                      minLength={20}
                      required
                      rows={4}
                      value={interest}
                      onChange={(event) => setInterest(event.target.value)}
                    />
                  </label>
                  {requestMessage && <p className="verify-auth-error" role="alert">{requestMessage}</p>}
                  <button className="primary" disabled={requestSubmitting} type="submit">
                    {requestSubmitting ? "Enviando…" : "Enviar solicitação"}
                  </button>
                  <button
                    className="outline"
                    onClick={() => {
                      setRequestMode(false);
                      setRequestMessage("");
                    }}
                    type="button"
                  >
                    Voltar para entrar
                  </button>
                </form>
              </>
            )}
          </>
        ) : (
          <>
            <span className="eyebrow">Acesso privado</span>
            <h1 id="verify-invite-title">Acesse seu workspace.</h1>
            <p>
              Já aprovado? Use o e-mail do convite para receber um código
              temporário. Ainda não tem acesso? Solicite participação no Beta,
              sujeita à aprovação da equipe RRV.
            </p>
            {!codeRequested ? (
            <form onSubmit={requestCode}>
              <label>
                Nome
                <input
                  autoComplete="name"
                  maxLength={160}
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label>
                E-mail do convite
                <input
                  autoComplete="email"
                  maxLength={320}
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              {message && <p className="verify-auth-error" role="alert">{message}</p>}
              <button className="primary" disabled={submitting} type="submit">
                {submitting ? "Solicitando…" : "Enviar código temporário"}
              </button>
            </form>
            ) : (
              <form onSubmit={verifyCode}>
                <p>
                  Se <strong>{email}</strong> estiver cadastrado e houver convite
                  válido, você receberá um código de seis dígitos.
                </p>
                <label>
                  Código de acesso
                  <input
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={6}
                    minLength={6}
                    pattern="[0-9]{6}"
                    required
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </label>
                {message && <p className="verify-auth-error" role="alert">{message}</p>}
                <button className="primary" disabled={submitting || code.length !== 6} type="submit">
                  {submitting ? "Verificando…" : "Confirmar e acessar o painel"}
                </button>
            <button
              className="outline"
              onClick={() => {
                setCodeRequested(false);
                setCode("");
                setMessage("");
              }}
              type="button"
            >
              Alterar e-mail
            </button>
          </form>
        )}
            <button className="outline verify-auth-request-link" onClick={() => setRequestMode(true)} type="button">
              Solicitar acesso ao Beta
            </button>
          </>
        )}
      </section>
    </VerifyAccessShell>
  );
}

export function VerifyAccountSession() {
  const router = useRouter();
  const [message, setMessage] = useState("Verificando sua sessão segura…");

  useEffect(() => {
    getVerifySession()
      .then(() => router.replace("/start/verify/dashboard"))
      .catch((error: unknown) => {
        if (error instanceof VerifyApiError && error.status === 401) {
          router.replace("/start/verify/access");
          return;
        }
        setMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível verificar sua sessão.",
        );
      });
  }, [router]);

  return (
    <VerifyAccessShell>
      <section className="verify-auth-panel" aria-labelledby="verify-session-title">
        <span className="eyebrow">Acesso privado</span>
        <h1 id="verify-session-title">Abrindo seu painel.</h1>
        <p role="status">{message}</p>
        {message !== "Verificando sua sessão segura…" && (
          <button className="outline" onClick={() => router.refresh()} type="button">
            Tentar novamente
          </button>
        )}
      </section>
    </VerifyAccessShell>
  );
}
