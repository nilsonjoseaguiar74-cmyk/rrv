import Link from "next/link";
import { RRVLogo } from "@/components/brand/RRVLogo";
import { LocalAdminLoginForm } from "@/components/admin/LocalAdminLoginForm";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return <main className="admin-login"><Link href="/" className="admin-login-brand"><RRVLogo variant="monochrome" /></Link><section><div><span>Workspace privado</span><h1>Admin<br/>RRV.</h1></div><div className="admin-login-panel"><p>Entre com seu e-mail e senha para editar conteúdo, publicar alterações e acompanhar leads.</p><LocalAdminLoginForm/><small>Autenticação local, sessão segura e permissões verificadas no servidor. Nenhuma conta ChatGPT é necessária.</small></div></section></main>;
}
