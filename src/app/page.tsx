import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ContextualCta } from "@/components/sections/contextual-cta";
import { CasePreview } from "@/components/sections/case-preview";
import { Disciplines } from "@/components/sections/disciplines";
import { Hero } from "@/components/sections/hero";
import { KnowledgePreview } from "@/components/sections/knowledge-preview";
import { Professionals } from "@/components/sections/professionals";
import { SelectedWork } from "@/components/sections/selected-work";
import { ServicesField } from "@/components/sections/services-field";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <SelectedWork />
        <ServicesField />
        <Disciplines />
        <Professionals />
        <KnowledgePreview />
        <CasePreview />
        <ContextualCta />
      </main>
      <Footer />
    </>
  );
}
