import Link from "next/link";

export default function Home() {
  return <main className="shell landing">
    <header className="topbar"><span className="brand"><span className="brand-mark">✦</span> amigo secreto</span><Link className="toplink" href="/admin">Área do organizador ↗</Link></header>
    <section className="hero">
      <div className="eyebrow"><span className="live-dot" /> UM JEITO MAIS DIVERTIDO DE SORTEAR</div>
      <h1>O presente certo<br />começa com um <em>segredo.</em></h1>
      <p>Crie um sorteio para cada ocasião, convide seus amigos e deixe a surpresa acontecer. Cada pessoa descobre seu amigo secreto com segurança, no seu tempo.</p>
      <Link className="button primary" href="/admin">Criar um sorteio <span>→</span></Link>
      <div className="hero-note">Recebeu um convite? Abra o link enviado pelo organizador.</div>
    </section>
    <section className="steps" aria-label="Como funciona">
      <div className="step"><span className="step-number">01</span><div className="step-icon">✎</div><h2>Monte seu grupo</h2><p>Adicione nomes e emails e dê um nome especial ao sorteio.</p></div>
      <div className="step"><span className="step-number">02</span><div className="step-icon">↗</div><h2>Compartilhe o link</h2><p>Envie o mesmo convite para todos os participantes.</p></div>
      <div className="step"><span className="step-number">03</span><div className="step-icon">✦</div><h2>Revele a surpresa</h2><p>Cada amigo confirma seu email e descobre quem tirou.</p></div>
    </section>
    <footer className="footer">Feito para reunir pessoas, uma surpresa de cada vez. <span>✦</span></footer>
  </main>;
}
