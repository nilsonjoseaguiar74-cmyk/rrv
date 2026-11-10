import StartClient from "@/components/start/StartClient";
import { getPublicSiteData } from "@/lib/cms/server";

export const dynamic = "force-dynamic";

export default async function StartPage() {
  const { settings } = await getPublicSiteData();
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "ProfessionalService"],
    name: "RRV.digital",
    url: "https://rrv.digital",
    slogan: "Growth. Experience. Engineering.",
    areaServed: "BR",
    serviceType: ["Desenvolvimento de software", "Sites", "Automação", "Inteligência Artificial", "Infraestrutura digital"],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <StartClient settings={settings} />
    </>
  );
}
