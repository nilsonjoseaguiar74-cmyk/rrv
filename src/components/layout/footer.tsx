import Image from "next/image";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand"><Image src="/brand/rrv-logo.svg" alt="RRV.digital" width={65} height={30} /><span>Growth. Experience. Engineering.</span></div>
      <div><span>RRV.digital</span><span>Independent digital collective</span></div>
      <div><a className="focus-ring" href="#top">Voltar ao topo →</a><span>© {new Date().getFullYear()} RRV.digital</span></div>
    </footer>
  );
}
