import Link from "next/link";

const stats = [
  { label: "Published", value: "03" },
  { label: "Draft", value: "00" },
  { label: "Featured", value: "03" },
];

export default function ManagementDashboard() {
  return (
    <div className="mgmt-page">
      <div className="mgmt-kicker"><span>Overview</span><span>Management foundation / 01</span></div>
      <div className="mgmt-title">
        <div><span>RRV.digital</span><h1>Management.</h1></div>
        <p>Project content structure prepared for the persistent data layer planned for the next phase.</p>
      </div>

      <section className="mgmt-stats" aria-label="Project status">
        {stats.map((stat) => <article key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></article>)}
      </section>

      <nav className="mgmt-actions" aria-label="Management actions">
        <Link href="/gestao/projetos/novo"><span>01</span><strong>New project</strong><b>＋</b></Link>
        <Link href="/gestao/projetos"><span>02</span><strong>Manage projects</strong><b>→</b></Link>
        <Link href="/" target="_blank"><span>03</span><strong>Open website</strong><b>↗</b></Link>
      </nav>
    </div>
  );
}
