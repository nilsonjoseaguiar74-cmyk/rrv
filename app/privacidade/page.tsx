import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacidade | RRV.digital",
  description: "Informações sobre o tratamento de dados enviados à RRV.digital.",
};

export default function PrivacyPage() {
  return (
    <main className="start-site start-privacy">
      <header className="start-header"><Link className="start-brand" href="/">RRV<span>.</span></Link><Link className="start-header-cta" href="/start">Voltar para Start ↗</Link></header>
      <article>
        <p className="start-eyebrow"><span>RRV / PRIVACIDADE</span><span>Atualizado em agosto de 2026</span></p>
        <h1>Privacidade com<br/>clareza.</h1>
        <section><h2>Dados enviados</h2><p>Ao preencher o formulário Start, a RRV.digital recebe os dados informados por você, incluindo nome, contatos, empresa, descrição do projeto e parâmetros de origem da visita.</p></section>
        <section><h2>Finalidade</h2><p>Esses dados são usados exclusivamente para analisar sua solicitação, entrar em contato, preparar o diagnóstico e manter o histórico comercial necessário ao atendimento.</p></section>
        <section><h2>Compartilhamento e segurança</h2><p>Não comercializamos seus dados. O acesso é restrito à operação da RRV.digital e aos serviços técnicos necessários ao funcionamento seguro da página.</p></section>
        <section><h2>Seus direitos</h2><p>Você pode solicitar acesso, correção ou exclusão dos dados enviados entrando em contato pelo e-mail hello@rrv.digital.</p></section>
      </article>
    </main>
  );
}
