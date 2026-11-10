import Link from "next/link";
import { RRVLogo } from "@/components/brand/RRVLogo";

export function ManagementShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mgmt-shell">
      <header className="mgmt-header">
        <Link className="mgmt-brand" href="/gestao" aria-label="RRV.digital Management">
          <RRVLogo variant="monochrome" />
          <small>Management</small>
        </Link>
        <nav aria-label="Management navigation">
          <Link href="/gestao">Overview</Link>
          <Link href="/gestao/projetos">Projects</Link>
          <Link href="/" target="_blank">Open website ↗</Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
