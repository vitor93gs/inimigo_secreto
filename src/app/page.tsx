import Link from "next/link";
import { DecorativePhoto } from "@/components/decorative-photo";

export default function Home() {
  return <main className="shell landing">
    <header className="topbar"><span className="brand"><span className="brand-mark">✦</span> inimigo secreto</span><Link className="toplink" href="/admin">Área do mentor do caos ↗</Link></header>

    <section className="hero hero-stage">
      <div className="hero-photos">
        <DecorativePhoto number={18} className="hero-photo hero-photo-main" sizes="340px" eager />
        <DecorativePhoto number={20} className="hero-photo hero-photo-side" sizes="230px" />
        <DecorativePhoto number={1} className="hero-photo hero-photo-ghost" sizes="190px" />
      </div>
      <div className="hero-copy">
        <div className="eyebrow"><span className="live-dot" /> AMIZADES EM RISCO DESDE AGORA</div>
        <h1>Todo presente vem<br />com <em>segundas intenções.</em></h1>
        <p>O sorteio em que todo mundo ganha um nome e perde um pouco da inocência. Sem repetir pessoas, sem tirar a si mesmo e sem desculpa para dar outra caneca.</p>
        <Link className="button primary photo-button" href="/admin"><DecorativePhoto number={9} className="button-photo" sizes="42px" /> Começar a conspiração <span>→</span></Link>
        <div className="hero-note">Recebeu um convite? Abra o link do organizador. Seus amigos já estão desconfiados.</div>
      </div>
    </section>

    <section className="suspects scattered-scene" aria-labelledby="suspects-title">
      <div className="scene-photos">
        {[8, 10, 11, 14, 15, 16, 17, 2].map((number, index) =>
          <DecorativePhoto number={number} className={`scene-photo scene-photo-${index + 1}`} key={number} sizes="(max-width: 700px) 150px, 230px" />
        )}
      </div>
      <div className="scene-copy">
        <p className="kicker">ARQUIVO CONFIDENCIAL · NENHUM ÁLIBI CONVINCENTE</p>
        <h2 id="suspects-title">Todo mundo é <em>suspeito.</em></h2>
        <p>As testemunhas insistem que são amigos. A investigação segue em andamento.</p>
      </div>
      <p className="scene-footnote">Nenhuma testemunha quis prestar depoimento.</p>
    </section>

    <section className="steps" aria-label="Como funciona">
      <div className="step"><DecorativePhoto number={3} className="step-photo" sizes="150px" /><span className="step-number">01</span><div className="step-icon">✎</div><h2>Reúna os suspeitos</h2><p>Cadastre nomes e emails. É menos invasivo que o grupo da família.</p></div>
      <div className="step"><DecorativePhoto number={4} className="step-photo" sizes="150px" /><span className="step-number">02</span><div className="step-icon">↗</div><h2>Espalhe o convite</h2><p>Compartilhe o link com todos. Depois finja que não foi você.</p></div>
      <div className="step"><DecorativePhoto number={6} className="step-photo" sizes="150px" /><span className="step-number">03</span><div className="step-icon">✦</div><h2>Descubra o alvo</h2><p>Cada pessoa confirma seu email e recebe sua missão. O presente duvidoso é por sua conta.</p></div>
    </section>

    <section className="finale" aria-labelledby="finale-title">
      <div className="finale-photos">
        {[5, 7, 12, 13, 19].map((number, index) =>
          <DecorativePhoto number={number} className={`finale-photo finale-photo-${index + 1}`} key={number} sizes="(max-width: 700px) 120px, 200px" />
        )}
      </div>
      <div className="finale-copy">
        <p className="kicker">A REVIRAVOLTA É SUA</p>
        <h2 id="finale-title">Escolha o nome. Planeje o presente. Negue tudo.</h2>
        <Link className="button primary" href="/admin">Criar um sorteio <span>↗</span></Link>
      </div>
    </section>

    <footer className="footer">Amizades podem acabar. Um presente ruim vira lenda. <span>✦</span></footer>
  </main>;
}
