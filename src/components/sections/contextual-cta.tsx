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
  return <section className="contact section-pad" id="contact" aria-labelledby="contact-title"><div className="contact__context"><span>Current context</span><i /><span>{context}</span></div><p id="contact-title">{copy[context][0]}</p><a className="focus-ring" href={`mailto:hello@rrv.digital?subject=${encodeURIComponent(`RRV — ${context}`)}`}><span>{copy[context][1]}</span><span aria-hidden="true">→</span></a></section>;
}
