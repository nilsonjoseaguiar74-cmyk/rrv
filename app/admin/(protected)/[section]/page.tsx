import { notFound } from "next/navigation";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";

export const dynamic = "force-dynamic";
const sections = ["home", "services", "projects", "team", "ctas", "leads", "settings"] as const;

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section as typeof sections[number])) notFound();
  return <AdminWorkspace section={section as typeof sections[number]} />;
}
