import type { Metadata } from "next";
import "@/styles/verify.css";

export const metadata: Metadata = {
  title: "RRV Verify | RRV.digital",
  description:
    "Cadastre projetos, requisitos e entregas em um workspace privado do RRV Verify.",
};

export default function VerifyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
