"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { readApiResponse } from "@/lib/api-response";

type Person = { name: string; email: string };
type AdminDraw = { id: string; name: string; status: "draft" | "published"; participants: number; completed: number; participantsList: Person[] };
const blank = (): Person => ({ name: "", email: "" });

export default function AdminPage() {
  const [draws, setDraws] = useState<AdminDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [editor, setEditor] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [people, setPeople] = useState<Person[]>([blank(), blank()]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/draws", { cache: "no-store" });
      setAuthorized(response.ok);
      if (response.ok) setDraws((await readApiResponse<{ draws: AdminDraw[] }>(response)).draws);
    } catch { setMessage("Não foi possível conectar. Tente novamente."); }
    finally { setLoading(false); }
  }, []);
  // Fetching on mount updates state only after the request resolves.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function requestLink(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await readApiResponse<object>(response);
      if (!response.ok) throw new Error(data.error);
      setSent(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Erro ao enviar email."); }
    finally { setBusy(false); }
  }

  function start(draw?: AdminDraw) {
    setEditor(draw?.id || "new"); setName(draw?.name || "");
    setPeople(draw?.participantsList.map((person) => ({ ...person })) || [blank(), blank()]); setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const path = editor === "new" ? "/api/admin/draws" : `/api/admin/draws/${editor}`;
      const response = await fetch(path, { method: editor === "new" ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, participants: people }) });
      const data = await readApiResponse<object>(response);
      if (!response.ok) throw new Error(data.error);
      setEditor(null); await load(); setMessage("Rascunho salvo. Revise a lista de suspeitos antes de publicar.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar."); }
    finally { setBusy(false); }
  }

  async function publish(draw: AdminDraw) {
    if (!window.confirm(`Publicar “${draw.name}” com ${draw.participants} participantes? Depois disso, a lista ficará bloqueada.`)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/draws/${draw.id}/publish`, { method: "POST" });
      const data = await readApiResponse<object>(response);
      if (!response.ok) throw new Error(data.error);
      await load(); setMessage("Cilada publicada. Agora espalhe o link com cara de inocente.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível publicar."); }
    finally { setBusy(false); }
  }

  async function copyLink(id: string) {
    try { await navigator.clipboard.writeText(`${window.location.origin}/s/${id}`); setMessage("Link copiado. Apague suas digitais."); }
    catch { setMessage(`Copie este link: ${window.location.origin}/s/${id}`); }
  }

  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); location.reload(); }

  return <main className="shell app-shell">
    <header className="topbar"><Link href="/" className="brand"><span className="brand-mark">✦</span> inimigo secreto</Link><span className="toplink">CENTRAL DO CAOS</span></header>
    {loading ? <div className="panel"><p>Carregando...</p></div> : !authorized ?
      <section className="auth-wrap"><div className="panel auth-panel"><div className="big-symbol">✦</div><p className="kicker">BEM-VINDO, MENTOR DO CAOS</p><h1>Seus esquemas começam aqui.</h1><p>Entre com o email de administrador. Até o caos precisa de alguém com acesso ao painel.</p>{sent ? <div className="notice success">Confira sua caixa de entrada. Seu álibi expira em 15 minutos.</div> : <form onSubmit={requestLink}><label htmlFor="admin-email">Seu email</label><input id="admin-email" type="email" autoComplete="email" placeholder="voce@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} required /><button className="button primary full" disabled={busy}>{busy ? "Enviando..." : "Receber link de acesso"} <span>→</span></button></form>}{message && <div className="notice error">{message}</div>}</div></section>
    : <div className="dashboard"><div className="dashboard-head"><div><p className="kicker">ARQUIVO DE CONSPIRAÇÕES</p><h1>Seus planos<span className="accent">.</span></h1><p>Crie outra conspiração ou acompanhe quem aceitou participar por livre e espontânea pressão.</p></div><div className="head-actions"><button className="button primary" onClick={() => start()}>＋ Novo plano</button><button className="text-button" onClick={logout}>Sair</button></div></div>
      {message && <div className="notice">{message}</div>}
      {editor && <section className="panel editor"><div className="section-heading"><div><p className="kicker">{editor === "new" ? "NOVO SORTEIO" : "EDITAR RASCUNHO"}</p><h2>Prepare a cilada</h2></div><button className="text-button" onClick={() => setEditor(null)}>Fechar ×</button></div><form onSubmit={save}><label htmlFor="draw-name">Nome da conspiração</label><input id="draw-name" placeholder="Ex.: Novembro 2026" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={80} /><div className="people-head"><div><h3>Lista de suspeitos</h3><p>Pelo menos duas pessoas. Um email por vítima, por favor.</p></div><span className="count-badge">{people.length} pessoas</span></div><div className="people-list">{people.map((person, index) => <div className="person-row" key={index}><span className="person-index">{String(index + 1).padStart(2, "0")}</span><input aria-label={`Nome da pessoa ${index + 1}`} placeholder="Nome" value={person.name} onChange={(event) => setPeople(people.map((p, i) => i === index ? { ...p, name: event.target.value } : p))} required /><input aria-label={`Email da pessoa ${index + 1}`} type="email" placeholder="email@exemplo.com" value={person.email} onChange={(event) => setPeople(people.map((p, i) => i === index ? { ...p, email: event.target.value } : p))} required /><button type="button" className="remove-button" aria-label={`Remover pessoa ${index + 1}`} disabled={people.length <= 2} onClick={() => setPeople(people.filter((_, i) => i !== index))}>×</button></div>)}</div><button type="button" className="add-button" onClick={() => setPeople([...people, blank()])}>＋ Adicionar suspeito</button><div className="form-actions"><button type="button" className="button secondary" onClick={() => setEditor(null)}>Cancelar</button><button className="button primary" disabled={busy}>{busy ? "Salvando..." : "Salvar rascunho"} <span>→</span></button></div></form></section>}
      <div className="draw-grid">{draws.length ? draws.map((draw) => <article className="draw-card" key={draw.id}><div className="card-top"><span className={`status ${draw.status}`}>{draw.status === "draft" ? "Rascunho" : draw.completed === draw.participants ? "Concluído" : "Publicado"}</span><span className="card-spark">✦</span></div><h2>{draw.name}</h2><p className="card-meta">{draw.participants} participantes <span>·</span> {draw.completed} já sortearam</p><div className="progress"><span style={{ width: `${draw.participants ? draw.completed / draw.participants * 100 : 0}%` }} /></div>{draw.status === "draft" ? <><div className="preview-list">{draw.participantsList.map((person) => <div key={person.email}><strong>{person.name}</strong><span>{person.email}</span></div>)}</div><div className="card-actions"><button className="button secondary" onClick={() => start(draw)}>Editar</button><button className="button primary" disabled={busy} onClick={() => publish(draw)}>Publicar →</button></div></> : <div className="card-actions"><Link className="button secondary" href={`/s/${draw.id}`}>Abrir página ↗</Link><button className="button primary" onClick={() => void copyLink(draw.id)}>Copiar link ↗</button></div>}</article>) : <div className="empty-state"><div className="big-symbol">✦</div><h2>Nenhuma conspiração registrada.</h2><p>Reúna suas pessoas queridas... ou quase. O arrependimento vem depois.</p><button className="button primary" onClick={() => start()}>Criar sorteio →</button></div>}</div>
    </div>}
  </main>;
}
