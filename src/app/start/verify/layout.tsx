import type { Metadata } from "next";
import "@/styles/verify.css";

export const metadata: Metadata = {
  title: "RRV Verify | RRV.digital",
  description:
    "Defina escopos, acompanhe versões e preserve evidências demonstrativas no RRV Verify.",
};

export default function VerifyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
