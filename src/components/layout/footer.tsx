export function Footer() {
  return (
    <footer className="site-footer">
      <a className="brand brand--light focus-ring" href="#top" aria-label="Voltar ao início">RRV<span>.digital</span></a>
      <p>Growth × Experience × Engineering · One system</p>
      <p>© {new Date().getFullYear()} RRV.digital</p>
    </footer>
  );
}
