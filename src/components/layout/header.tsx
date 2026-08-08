const navigation = [
  { href: "#work", label: "Trabalho" },
  { href: "#services", label: "Serviços" },
  { href: "#capabilities", label: "Mapa" },
  { href: "#contact", label: "Contato" },
];

export function Header() {
  return (
    <header className="site-header">
      <a className="brand focus-ring" href="#top" aria-label="RRV.digital — início"><Image src="/brand/rrv-logo.svg" alt="" width={64} height={30} priority /><span>RRV.digital</span></a>
      <nav aria-label="Navegação principal">
        <ul>
          {navigation.map((item) => <li key={item.href}><a className="focus-ring" href={item.href}>{item.label}</a></li>)}
        </ul>
      </nav>
      <a className="header-cta focus-ring" href="#contact">Iniciar projeto <span aria-hidden="true">→</span></a>
    </header>
  );
}
import Image from "next/image";
