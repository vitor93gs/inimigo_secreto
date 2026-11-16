import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SAC — Inimigo Secreto",
  description: "O canal de atendimento do Inimigo Secreto.",
};

export default function SacPage() {
  return <main className="shell app-shell sac-page">
    <header className="topbar">
      <Link href="/" className="brand"><span className="brand-mark">✦</span> inimigo secreto</Link>
      <Link href="/" className="toplink">Voltar ao início ↗</Link>
    </header>

    <section className="sac-stage" aria-labelledby="sac-title">
      <p className="kicker">CANAL OFICIAL DE RECLAMAÇÕES</p>
      <h1 id="sac-title">Serviço de Atendimento ao Caos<span className="accent">.</span></h1>
      <p className="sac-intro">Tem alguma reclamação? Nosso atendimento está pronto para ouvir. Mais ou menos.</p>

      <details className="sac-disclosure">
        <summary className="button primary sac-trigger">
          <span className="sac-label-closed">ABRIR O SAC</span>
          <span className="sac-label-open">FECHAR O SAC</span>
          <span aria-hidden="true">↘</span>
        </summary>
        <div className="sac-reveal">
          <Image className="sac-image" src="/sac/atendimento.png" width={321} height={311} alt="Rosto com uma expressão inquietante" />
          <Image className="sac-image" src="/sac/galantia.png" width={340} height={308} alt="Meme com a frase: NÃO TÊM GALANTIA" />
        </div>
      </details>
    </section>
  </main>;
}
