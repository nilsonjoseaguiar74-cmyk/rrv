import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RotatingFavicon from "@/components/site/RotatingFavicon";
import WhatsAppButton from "@/components/site/WhatsAppButton";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RRV.digital",
  description: "Growth, experiência e engenharia digital. Sites, sistemas, backend, automação e inteligência artificial em Florianópolis, SC.",
  metadataBase: new URL("https://www.rrv.digital"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "RRV.digital",
    title: "RRV.digital",
    description: "Growth, experiência e engenharia digital. Sites, sistemas, backend, automação e inteligência artificial.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RRV.digital",
    description: "Growth, experiência e engenharia digital. Sites, sistemas, backend, automação e inteligência artificial.",
  },
  other: { "codex-preview": "development" },
  icons: {
    icon: "/brand/favicon01.png",
    shortcut: "/brand/favicon01.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geist.variable} ${mono.variable}`}>
        <RotatingFavicon />{children}<WhatsAppButton /></body></html>;
}
