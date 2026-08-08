import type { Metadata } from "next";
import "@/styles/globals.css";
import { AdaptiveContextProvider } from "@/components/context/adaptive-context";

export const metadata: Metadata = {
  title: "RRV.digital — One digital system",
  description: "Growth, Experience e Engineering como um único sistema digital.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body><AdaptiveContextProvider>{children}</AdaptiveContextProvider></body>
    </html>
  );
}
