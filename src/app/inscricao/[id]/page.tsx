"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { DecorativePhoto } from "@/components/decorative-photo";
import { readApiResponse } from "@/lib/api-response";

type RegistrationDraw = { id: string; name: string; status: "draft" | "published" };

function RegistrationContent() {
  const { id } = useParams<{ id: string }>();
  const [draw, setDraw] = useState<RegistrationDraw | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/inscricoes/${id}`, { cache: "no-store" });
      const data = await readApiResponse<{ draw: RegistrationDraw }>(response);
      if (!response.ok) throw new Error(data.error);
      setDraw(data.draw);
    } catch (issue) { setError(issue instanceof Error ? issue.message : "Não foi possível carregar a inscrição."); }
    finally { setLoading(false); }
  }, [id]);
  // Fetching on mount updates state only after the request resolves.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/inscricoes/${id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await readApiResponse<object>(response);
      if (response.status === 409) void load();
      if (!response.ok) throw new Error(data.error);
      setSent(true);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Não foi possível enviar sua inscrição.");
    } finally { setBusy(false); }
  }

  return <main className="shell app-shell">
    <header className="topbar"><Link href="/" className="brand"><span className="brand-mark">✦</span> inimigo secreto</Link><span className="toplink">LISTA DE SUSPEITOS</span></header>
    <section className="registration-wrap">
      <DecorativePhoto number={10} className="registration-photo registration-photo-left" sizes="210px" eager />
      <DecorativePhoto number={18} className="registration-photo registration-photo-right" sizes="190px" />
      <div className="panel registration-panel">
        {loading ? <p>Carregando inscrição...</p> : !draw ? <><p className="kicker">SEM PISTAS</p><h1>Este convite desapareceu.</h1><p>{error}</p><Link className="button secondary" href="/">Voltar ao início →</Link></> : draw.status === "published" ? <><p className="kicker">INSCRIÇÕES ENCERRADAS</p><h1>A lista já foi fechada.</h1><p>O sorteio começou. Se você foi aprovado, entre com seu email na página de participação.</p><Link className="button primary" href={`/s/${id}`}>Ir para o sorteio <span>→</span></Link></> : sent ? <><p className="kicker">PEDIDO REGISTRADO</p><h1>Seu nome entrou na investigação.</h1><p>O organizador vai revisar sua inscrição. Guarde este convite: depois da publicação, abra o mesmo link para confirmar seu email e descobrir seu inimigo secreto.</p></> : <><p className="kicker">INSCRIÇÕES ABERTAS</p><h1>Quer entrar nessa cilada?</h1><p>Peça para participar de <strong>{draw.name}</strong>. O organizador decide quem entra antes de publicar o sorteio.</p><form onSubmit={submit} className="registration-form"><label htmlFor="registration-name">Seu nome</label><input id="registration-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={80} required placeholder="Como devemos chamar você?" /><label htmlFor="registration-email">Seu email</label><input id="registration-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required placeholder="voce@exemplo.com" /><button className="button primary full" disabled={busy}>{busy ? "Enviando..." : "Pedir para participar"} <span>→</span></button></form><p className="registration-note">Seu email só será usado no sorteio se o organizador aprovar você. Depois, ele será confirmado por um link de acesso.</p></>}
        {error && draw?.status === "draft" && <div className="notice error">{error}</div>}
      </div>
    </section>
  </main>;
}

export default function RegistrationPage() {
  return <Suspense fallback={<main className="center-page"><p>Carregando inscrição...</p></main>}><RegistrationContent /></Suspense>;
}
