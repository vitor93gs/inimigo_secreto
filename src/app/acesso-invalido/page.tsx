import Link from "next/link";

export default function InvalidAccess() {
  return <main className="center-page"><div className="panel narrow"><div className="big-symbol">✦</div><p className="kicker">LINK INDISPONÍVEL</p><h1>Este acesso expirou.</h1><p>Os links de entrada funcionam uma vez e valem por 15 minutos. Volte ao sorteio e peça um novo.</p><Link className="button primary" href="/">Voltar ao início →</Link></div></main>;
}
