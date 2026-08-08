const navigation = [
  { href: "#work", label: "Trabalho" },
  { href: "#services", label: "Serviços" },
  { href: "#capabilities", label: "Mapa" },
  { href: "#contact", label: "Contato" },
];

export function Header() {
  return (
    <header className="site-header">
      <a className="brand focus-ring" href="#top" aria-label="RRV.digital — início">RRV<span>.digital</span></a>
      <nav aria-label="Navegação principal">
        <ul>
          {navigation.map((item) => <li key={item.href}><a className="focus-ring" href={item.href}>{item.label}</a></li>)}
        </ul>
      </nav>
      <a className="header-cta focus-ring" href="#contact">Iniciar conversa <span aria-hidden="true">↗</span></a>
    </header>
  );
}
