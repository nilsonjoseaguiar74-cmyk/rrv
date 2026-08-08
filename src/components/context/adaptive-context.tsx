"use client";

import { createContext, useContext, useEffect, useReducer } from "react";
import type { AdaptiveContext, ContextDiscipline } from "@/domain/models";

type ContextState = {
  context: AdaptiveContext;
  previousContext: AdaptiveContext;
};

type ContextAction = { type: "transition"; context: AdaptiveContext };

const initialState: ContextState = { context: "neutral", previousContext: "neutral" };
const Context = createContext<ContextState>(initialState);
const contexts: ContextDiscipline[] = ["growth", "experience", "engineering"];
const adaptiveContexts: AdaptiveContext[] = [...contexts, "neutral", "convergence"];
const STORAGE_KEY = "rrv-adaptive-context";

function isAdaptiveContext(value: string): value is AdaptiveContext {
  return adaptiveContexts.some((context) => context === value);
}

function contextReducer(state: ContextState, action: ContextAction): ContextState {
  if (action.context === state.context) return state;
  return { context: action.context, previousContext: state.context };
}

export function AdaptiveContextProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(contextReducer, initialState);
  const { context } = state;

  useEffect(() => {
    const restoreStoredContext = () => {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored && isAdaptiveContext(stored)) {
        dispatch({ type: "transition", context: stored });
      }
    };
    const restoreTimer = window.setTimeout(restoreStoredContext, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-context]"));
    const scores = new Map<Element, { context: ContextDiscipline; score: number }>();
    let dwellTimer: ReturnType<typeof setTimeout> | undefined;
    let lastSwitch = 0;

    const resolve = () => {
      const totals = new Map(contexts.map((item) => [item, 0]));
      scores.forEach(({ context: itemContext, score }) => totals.set(itemContext, (totals.get(itemContext) ?? 0) + score));
      const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
      if (ranked[0][1] < 0.22) return "neutral" as AdaptiveContext;
      if (ranked[1][1] > 0.2 && ranked[0][1] - ranked[1][1] < 0.16) return "convergence" as AdaptiveContext;
      return ranked[0][0];
    };

    const schedule = () => {
      clearTimeout(dwellTimer);
      dwellTimer = setTimeout(() => {
        const next = resolve();
        if (Date.now() - lastSwitch < 620) return;
        lastSwitch = Date.now();
        dispatch({ type: "transition", context: next });
        sessionStorage.setItem(STORAGE_KEY, next);
      }, 380);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target as HTMLElement;
        const itemContext = element.dataset.context as ContextDiscipline;
        const centerDistance = Math.abs(entry.boundingClientRect.top + entry.boundingClientRect.height / 2 - innerHeight / 2) / innerHeight;
        scores.set(element, { context: itemContext, score: entry.isIntersecting ? entry.intersectionRatio * Math.max(0.35, 1 - centerDistance) : 0 });
      });
      schedule();
    }, { threshold: [0, .2, .4, .6, .8], rootMargin: "-8% 0px -12%" });

    const onFocus = (event: FocusEvent) => {
      const node = (event.target as HTMLElement).closest<HTMLElement>("[data-context]");
      if (!node?.dataset.context) return;
      scores.set(node, { context: node.dataset.context as ContextDiscipline, score: 1.2 });
      schedule();
    };
    nodes.forEach((node) => observer.observe(node));
    document.addEventListener("focusin", onFocus);
    return () => { observer.disconnect(); document.removeEventListener("focusin", onFocus); clearTimeout(dwellTimer); };
  }, []);

  useEffect(() => { document.documentElement.dataset.context = context; }, [context]);
  return <Context.Provider value={state}>{children}</Context.Provider>;
}

export function useAdaptiveContext() { return useContext(Context); }
