import HomeClient from "@/components/public/HomeClient";
import { getPublicSiteData } from "@/lib/cms/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const content = await getPublicSiteData();
  return <HomeClient content={content} />;
}
