"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { VerifyProject, VerifySession } from "@/domain/verify/data";
import {
  getVerifyProjects,
  getVerifySession,
  VerifyApiError,
} from "@/lib/verify/api";
import VerifyApp from "@/components/verify/verify-app";

type RouteState =
  | { kind: "public" }
  | { kind: "loading" }
  | { kind: "error"; pathname: string; message: string }
  | { kind: "ready"; pathname: string; session: VerifySession; projects: VerifyProject[] };

export function VerifyRoute() {
  const pathname = usePathname();
  const router = useRouter();
  const isPublicLanding = pathname.replace(/\/+$/, "") === "/start/verify";
  const [state, setState] = useState<RouteState>(
    isPublicLanding ? { kind: "public" } : { kind: "loading" },
  );

  useEffect(() => {
    if (isPublicLanding) {
      setState({ kind: "public" });
      return;
    }

    let active = true;
    setState({ kind: "loading" });
    getVerifySession()
      .then(async (session) => ({
        session,
        projects: await getVerifyProjects(session.workspaces),
      }))
      .then(({ session, projects }) => {
        if (active) setState({ kind: "ready", pathname, session, projects });
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof VerifyApiError && error.status === 401) {
          router.replace("/start/verify/access");
          return;
        }
        setState({
          kind: "error",
          pathname,
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível carregar sua área privada.",
        });
      });

    return () => {
      active = false;
    };
  }, [isPublicLanding, pathname, router]);

  if (isPublicLanding && state.kind === "public") return <VerifyApp />;
  if (
    state.kind === "loading" ||
    state.kind === "public" ||
    ("pathname" in state && state.pathname !== pathname)
  ) {
    return (
      <div id="rrv-verify">
        <main className="verify-auth">
          <p role="status">Verificando sua sessão segura…</p>
        </main>
      </div>
    );
  }
  if (state.kind === "error" && state.pathname === pathname) {
    return (
      <div id="rrv-verify">
        <main className="verify-auth">
          <section className="verify-auth-panel" role="alert">
            <h1>Área indisponível.</h1>
            <p>{state.message}</p>
            <button className="outline" onClick={() => router.refresh()} type="button">
              Tentar novamente
            </button>
          </section>
        </main>
      </div>
    );
  }
  if (state.kind !== "ready") {
    return (
      <div id="rrv-verify">
        <main className="verify-auth"><p role="status">Verificando sua sessão segura…</p></main>
      </div>
    );
  }
  return (
    <VerifyApp
      session={state.session}
      projectsFromApi={state.projects}
      onProjectsChange={(projects) =>
        setState((current) =>
          current.kind === "ready" ? { ...current, projects } : current,
        )
      }
    />
  );
}
