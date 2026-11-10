import Link from "next/link";
import { chatGPTSignOutPath } from "@/app/chatgpt-auth";
import type { AdminIdentity } from "@/lib/admin/auth";
import { RRVLogo } from "@/components/brand/RRVLogo";

const navigation = [
  ["Dashboard", "/admin"], ["Home", "/admin/home"], ["Serviços", "/admin/services"],
  ["Projetos", "/admin/projects"], ["Equipe", "/admin/team"], ["CTAs", "/admin/ctas"],
  ["Leads", "/admin/leads"], ["Configurações", "/admin/settings"],
] as const;

export function AdminShell({ admin, children }: { admin: AdminIdentity; children: React.ReactNode }) {
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin" aria-label="RRV.digital Admin"><RRVLogo variant="monochrome" /><small>Admin</small></Link>
        <nav aria-label="Navegação administrativa">{navigation.map(([label, href], index) => <Link key={href} href={href}><span>{String(index + 1).padStart(2, "0")}</span>{label}</Link>)}</nav>
        <div className="admin-account"><strong>{admin.displayName}</strong><span>{admin.role}</span><a href={chatGPTSignOutPath("/")}>Sair</a></div>
      </aside>
      <section className="admin-stage">
        <header className="admin-topbar"><span>RRV.digital / Sistema editorial</span><div><Link href="/" target="_blank">Abrir site ↗</Link><span>{admin.email}</span></div></header>
        {children}
      </section>
    </main>
  );
}
