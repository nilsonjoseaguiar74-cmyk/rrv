"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RRVLogo } from "@/components/brand/RRVLogo";

export type LocalAdmin = { id: string; email: string; name: string; role: "owner" | "admin" | "editor" | "viewer" };
const AdminContext = createContext<LocalAdmin | null>(null);
export const useAdminSession = () => useContext(AdminContext);
const navigation = [["Dashboard","/admin"],["Home","/admin/home"],["Serviços","/admin/services"],["Projetos","/admin/projects"],["Equipe","/admin/team"],["CTAs","/admin/ctas"],["Leads","/admin/leads"],["Acesso Beta","/admin/verify-access"],["Configurações","/admin/settings"]] as const;

export function AdminSessionShell({ children }: { children: React.ReactNode }) {
  const [admin,setAdmin]=useState<LocalAdmin|null>(null); const [loading,setLoading]=useState(true); const router=useRouter(); const pathname=usePathname();
  useEffect(()=>{ fetch("/api/admin/auth/me",{cache:"no-store",credentials:"same-origin"}).then(async response=>{if(!response.ok)throw new Error();return response.json() as Promise<{user:LocalAdmin}>}).then(payload=>setAdmin(payload.user)).catch(()=>router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`)).finally(()=>setLoading(false)); },[pathname,router]);
  async function logout(){await fetch("/api/admin/auth/logout",{method:"POST",credentials:"same-origin"});router.replace("/admin/login");router.refresh()}
  if(loading||!admin)return <main className="admin-denied"><span>RRV / ADMIN</span><h1>Validando<br/>sessão.</h1></main>;
  return <AdminContext.Provider value={admin}><main className="admin-shell"><aside className="admin-sidebar"><Link className="admin-brand" href="/admin" aria-label="RRV.digital Admin"><RRVLogo variant="monochrome"/><small>Admin</small></Link><nav aria-label="Navegação administrativa">{navigation.map(([label,href],index)=><Link key={href} href={href}><span>{String(index+1).padStart(2,"0")}</span>{label}</Link>)}</nav><div className="admin-account"><strong>{admin.name}</strong><span>{admin.role}</span><button type="button" onClick={logout}>Sair</button></div></aside><section className="admin-stage"><header className="admin-topbar"><span>RRV.digital / Sistema editorial</span><div><Link href="/" target="_blank">Abrir site ↗</Link><span>{admin.email}</span></div></header>{children}</section></main></AdminContext.Provider>;
}
