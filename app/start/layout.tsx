import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "RRV.digital | Sites, Sistemas, IA e Automação",
  description: "Desenvolvimento de sites, sistemas, backend, automações, inteligência artificial e soluções digitais. Projetos a partir de R$ 199.",
  alternates: { canonical: "/start" },
  openGraph: {
    title: "RRV.digital | Sites, Sistemas, IA e Automação",
    description: "Comece pequeno, valide rápido e evolua sua solução digital conforme a demanda.",
    url: "/start",
    siteName: "RRV.digital",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RRV.digital | Sites, Sistemas, IA e Automação",
    description: "Sites, sistemas, IA e automações para começar rápido e escalar com inteligência.",
  },
};

export default function StartLayout({ children }: { children: ReactNode }) {
  return children;
}
