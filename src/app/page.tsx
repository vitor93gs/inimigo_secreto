import Link from "next/link";
import Image from "next/image";

const suspects = [1, 2, 3, 4, 5, 6, 7];

export default function Home() {
  return <main className="shell landing">
    <header className="topbar"><span className="brand"><span className="brand-mark">✦</span> inimigo secreto</span><Link className="toplink" href="/admin">Área do mentor do caos ↗</Link></header>
    <section className="hero">
      <div className="eyebrow"><span className="live-dot" /> AMIZADES EM RISCO DESDE AGORA</div>
      <h1>Todo presente vem<br />com <em>segundas intenções.</em></h1>
      <p>O sorteio em que todo mundo ganha um nome e perde um pouco da inocência. Sem repetir pessoas, sem tirar a si mesmo e sem desculpa para dar outra caneca.</p>
      <Link className="button primary" href="/admin">Começar a conspiração <span>→</span></Link>
      <div className="hero-note">Recebeu um convite? Abra o link do organizador. Seus amigos já estão desconfiados.</div>
    </section>
    <section className="suspects" aria-labelledby="suspects-title">
      <div className="suspects-heading">
        <div><p className="kicker">ARQUIVO CONFIDENCIAL · 7 PESSOAS, NENHUM ÁLIBI</p><h2 id="suspects-title">Todo mundo é <em>suspeito.</em></h2></div>
        <p>As testemunhas insistem que são amigos. A investigação segue em andamento.</p>
      </div>
      <div className="suspect-wall">
        {suspects.map((number) => <figure className={`suspect-card suspect-${number}`} key={number}>
          <div className="suspect-photo"><Image src={`/suspects/suspect-${String(number).padStart(2, "0")}.png`} alt="" fill sizes="(max-width: 700px) 45vw, 14vw" /></div>
          <figcaption><span>FICHA {String(number).padStart(2, "0")}</span><span>●</span></figcaption>
        </figure>)}
      </div>
      <p className="wall-note">Nenhuma foto revela o resultado do sorteio. Ainda.</p>
    </section>
    <section className="steps" aria-label="Como funciona">
      <div className="step"><span className="step-number">01</span><div className="step-icon">✎</div><h2>Reúna os suspeitos</h2><p>Cadastre nomes e emails. É menos invasivo que o grupo da família.</p></div>
      <div className="step"><span className="step-number">02</span><div className="step-icon">↗</div><h2>Espalhe o convite</h2><p>Compartilhe o link com todos. Depois finja que não foi você.</p></div>
      <div className="step"><span className="step-number">03</span><div className="step-icon">✦</div><h2>Descubra o alvo</h2><p>Cada pessoa confirma seu email e recebe sua missão. O presente duvidoso é por sua conta.</p></div>
    </section>
    <footer className="footer">Amizades podem acabar. Um presente ruim vira lenda. <span>✦</span></footer>
  </main>;
}
