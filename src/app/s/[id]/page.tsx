"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { readApiResponse } from "@/lib/api-response";

type State = { draw: { id: string; name: string; participants: number; completed: number }; me: { name: string; recipient: string | null } | null };

function DrawContent() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/draws/${id}`, { cache: "no-store" });
      const data = await readApiResponse<State>(response);
      if (!response.ok) throw new Error(data.error);
      setState(data);
    } catch (issue) { setError(issue instanceof Error ? issue.message : "Erro ao carregar sorteio."); }
    finally { setLoading(false); }
  }, [id]);
  // Fetching on mount updates state only after the request resolves.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function requestLink(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, drawId: id }) });
      const data = await readApiResponse<object>(response);
      if (!response.ok) throw new Error(data.error);
      setSent(true);
    } catch (issue) { setError(issue instanceof Error ? issue.message : "Não foi possível enviar o link."); }
    finally { setBusy(false); }
  }

  async function pick() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/draws/${id}/pick`, { method: "POST" });
      const data = await readApiResponse<object>(response);
      if (!response.ok) throw new Error(data.error);
      await load();
    } catch (issue) { setError(issue instanceof Error ? issue.message : "Não foi possível sortear."); }
    finally { setBusy(false); }
  }

  return <main className="shell app-shell"><header className="topbar"><Link href="/" className="brand"><span className="brand-mark">✦</span> amigo secreto</Link><span className="toplink">UM SORTEIO ESPECIAL</span></header><div className="draw-page">{loading ? <div className="panel narrow"><p>Carregando sorteio...</p></div> : !state ? <div className="panel narrow"><p className="kicker">OPS</p><h1>Não encontramos este sorteio.</h1><p>{error}</p><Link className="button primary" href="/">Voltar ao início →</Link></div> : <><div className="draw-intro"><p className="kicker">VOCÊ FOI CONVIDADO</p><h1>{state.draw.name}<span className="accent">.</span></h1><p>A surpresa está quase nas suas mãos.</p></div><div className="panel participant-panel">{state.me?.recipient ? <><div className="result-ornament">✦</div><p className="kicker">SEGREDO REVELADO</p><h2>Seu amigo secreto é...</h2><div className="recipient-name">{state.me.recipient}</div><p>Guarde essa surpresa com carinho. Só você pode ver este resultado.</p></> : state.me ? <><div className="big-symbol">✦</div><p className="kicker">OLÁ, {state.me.name.toUpperCase()}</p><h2>Pronto para descobrir?</h2><p>Um nome será escolhido para você. Depois do sorteio, ele ficará salvo aqui para quando quiser consultar.</p><button className="button primary big-button" disabled={busy} onClick={pick}>{busy ? "Sorteando..." : "Sortear meu amigo secreto"} <span>✦</span></button></> : <><div className="big-symbol">✦</div><p className="kicker">CONFIRME SUA PARTICIPAÇÃO</p><h2>Entre com seu email</h2><p>Use o email cadastrado pelo organizador. Enviaremos um link seguro para você participar.</p>{sent ? <div className="notice success">Se este email estiver na lista, você receberá um link em instantes. Confira sua caixa de entrada.</div> : <form className="login-form" onSubmit={requestLink}><label htmlFor="participant-email">Seu email</label><input id="participant-email" type="email" autoComplete="email" placeholder="voce@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} required /><button className="button primary full" disabled={busy}>{busy ? "Enviando..." : "Receber link de acesso"} <span>→</span></button></form>}</>}{error && <div className="notice error">{error}</div>}</div><div className="draw-progress"><span>{state.draw.completed} de {state.draw.participants} pessoas já sortearam</span><div className="progress"><span style={{ width: `${state.draw.completed / state.draw.participants * 100}%` }} /></div>{state.draw.completed === state.draw.participants && <strong>Todo mundo já descobriu seu amigo secreto! ✦</strong>}</div></>}</div></main>;
}

export default function DrawPage() {
  return <Suspense fallback={<main className="center-page"><p>Carregando sorteio...</p></main>}><DrawContent /></Suspense>;
}
