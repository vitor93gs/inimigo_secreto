import Link from "next/link";

export default function InvalidAccess() {
  return <main className="center-page"><div className="panel narrow"><div className="big-symbol">✦</div><p className="kicker">ARQUIVO ENCERRADO</p><h1>Este link morreu.</h1><p>Links de entrada sobrevivem por 15 minutos e só funcionam uma vez. Volte ao sorteio e peça outro antes que ele tenha o mesmo destino.</p><Link className="button primary" href="/">Voltar à cena do crime →</Link></div></main>;
}
