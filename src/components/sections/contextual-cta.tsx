"use client";

import { useAdaptiveContext } from "@/components/context/adaptive-context";

const copy = {
  neutral: ["Um sistema para desafios que atravessam disciplinas.", "Começar uma conversa"],
  growth: ["Transforme sinais em crescimento que pode ser medido.", "Falar sobre Growth"],
  experience: ["Faça a complexidade parecer inevitavelmente simples.", "Falar sobre Experience"],
  engineering: ["Construa uma base capaz de acompanhar a ambição.", "Falar sobre Engineering"],
  convergence: ["Os melhores problemas raramente cabem em uma disciplina.", "Construir em convergência"],
} as const;

export function ContextualCta() {
  const { context } = useAdaptiveContext();
  return <section className="contact" id="contact" aria-labelledby="contact-title"><p className="eyebrow">07 / Contextual contact</p><div><span className="context-label">Contexto inferido: {context}</span><h2 id="contact-title">{copy[context][0]}</h2><a className="contact__link focus-ring" href={`mailto:hello@rrv.digital?subject=${encodeURIComponent(`RRV — ${context}`)}`}>{copy[context][1]} <span aria-hidden="true">↗</span></a></div><p className="contact__note">Sem perfil, sem rastreamento pessoal. Apenas o contexto desta sessão, inferido localmente pelo que entra em foco.</p></section>;
}
