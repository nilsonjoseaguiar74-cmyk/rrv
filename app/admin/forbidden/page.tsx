import Link from "next/link";
import { chatGPTSignOutPath } from "@/app/chatgpt-auth";

export default function ForbiddenPage() { return <main className="admin-denied"><span>403 / Access control</span><h1>Acesso não autorizado.</h1><p>Sua identidade foi confirmada, mas esta conta não possui uma função administrativa ativa na RRV.digital.</p><div><a href={chatGPTSignOutPath("/admin/login")}>Entrar com outra conta</a><Link href="/">Voltar ao site</Link></div></main>; }
