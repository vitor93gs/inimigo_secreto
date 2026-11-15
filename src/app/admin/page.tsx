"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DecorativePhoto } from "@/components/decorative-photo";
import { readApiResponse } from "@/lib/api-response";

type Person = { name: string; email: string };
type Signup = { id: string; name: string; email: string; status: "pending" | "approved" | "rejected"; createdAt: string };
type AdminDraw = {
  id: string;
  name: string;
  status: "draft" | "published";
  participants: number;
  completed: number;
  participantsList: Person[];
  signups: Signup[];
};

const blank = (): Person => ({ name: "", email: "" });

export default function AdminPage() {
  const [draws, setDraws] = useState<AdminDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [editor, setEditor] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");

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
      const response = await fetch("/api/auth/request", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      const data = await readApiResponse<object>(response);
      if (!response.ok) throw new Error(data.error);
      setSent(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Erro ao enviar email."); }
    finally { setBusy(false); }
  }

  function start(draw?: AdminDraw) {
    setEditor(draw?.id || "new");
    setName(draw?.name || "");
    setPeople(draw?.participantsList.map((person) => ({ ...person })) || []);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const path = editor === "new" ? "/api/admin/draws" : `/api/admin/draws/${editor}`;
      const response = await fetch(path, {
        method: editor === "new" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, participants: people }),
      });
      const data = await readApiResponse<object>(response);
      if (!response.ok) throw new Error(data.error);
      setEditor(null); await load();
      setMessage("Rascunho salvo. Compartilhe o link de inscrição ou adicione participantes manualmente.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar."); }
    finally { setBusy(false); }
  }

  async function publish(draw: AdminDraw) {
    if (!window.confirm(`Publicar “${draw.name}” com ${draw.participants} participantes? As inscrições serão encerradas e a lista ficará bloqueada.`)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/draws/${draw.id}/publish`, { method: "POST" });
      const data = await readApiResponse<object>(response);
      if (!response.ok) throw new Error(data.error);
      await load(); setMessage("Sorteio publicado. Agora compartilhe o link de participação.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível publicar."); }
    finally { setBusy(false); }
  }

  async function review(drawId: string, signupId: string, decision: "approve" | "reject") {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/draws/${drawId}/inscricoes/${signupId}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision }),
      });
      const data = await readApiResponse<object>(response);
      if (!response.ok) throw new Error(data.error);
      await load();
      setMessage(decision === "approve" ? "Inscrição aprovada. A pessoa entrou na lista do sorteio." : "Inscrição recusada.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível revisar a inscrição."); }
    finally { setBusy(false); }
  }

  async function copyLink(id: string, kind: "registration" | "participation") {
    const path = kind === "registration" ? `/inscricao/${id}` : `/s/${id}`;
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage(kind === "registration" ? "Link de inscrição copiado. Agora convide os suspeitos." : "Link de participação copiado. Apague suas digitais.");
    } catch { setMessage(`Copie este link: ${url}`); }
  }

  function beginDelete(id: string) {
    setDeleteTarget(id);
    setDeleteName("");
    setMessage("");
  }

  async function deleteDraw(draw: AdminDraw) {
    if (deleteName !== draw.name) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/draws/${draw.id}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deleteName }),
      });
      const data = await readApiResponse<object>(response);
      if (!response.ok) throw new Error(data.error);
      if (editor === draw.id) setEditor(null);
      setDeleteTarget(null); setDeleteName("");
      await load();
      setMessage("Sorteio excluído. Os links de inscrição e participação não funcionam mais.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível excluir o sorteio."); }
    finally { setBusy(false); }
  }

  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); location.reload(); }

  return <main className="shell app-shell">
    <header className="topbar"><Link href="/" className="brand"><span className="brand-mark">✦</span> inimigo secreto</Link><span className="toplink">CENTRAL DO CAOS</span></header>
    {loading ? <div className="panel"><p>Carregando...</p></div> : !authorized ?
      <section className="auth-wrap">
        <div className="auth-photos"><DecorativePhoto number={15} className="auth-photo auth-photo-left" sizes="210px" /><DecorativePhoto number={13} className="auth-photo auth-photo-right" sizes="180px" eager /></div>
        <div className="panel auth-panel"><div className="big-symbol">✦</div><p className="kicker">BEM-VINDO, MENTOR DO CAOS</p><h1>Seus esquemas começam aqui.</h1><p>Entre com o email de administrador. Até o caos precisa de alguém com acesso ao painel.</p>{sent ? <div className="notice success">Confira sua caixa de entrada. Seu álibi expira em 15 minutos.</div> : <form onSubmit={requestLink}><label htmlFor="admin-email">Seu email</label><input id="admin-email" type="email" autoComplete="email" placeholder="voce@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} required /><button className="button primary full" disabled={busy}>{busy ? "Enviando..." : "Receber link de acesso"} <span>→</span></button></form>}{message && <div className="notice error">{message}</div>}</div>
      </section>
    : <div className="dashboard">
      <DecorativePhoto number={19} className="dashboard-photo" sizes="180px" />
      <div className="dashboard-head"><div><p className="kicker">ARQUIVO DE CONSPIRAÇÕES</p><h1>Seus planos<span className="accent">.</span></h1><p>Crie um rascunho, receba inscrições e escolha quem entra na lista antes de publicar.</p></div><div className="head-actions"><button className="button primary" onClick={() => start()}>＋ Novo plano</button><button className="text-button" onClick={() => void load()}>Atualizar</button><button className="text-button" onClick={logout}>Sair</button></div></div>
      {message && <div className="notice">{message}</div>}
      {editor && <section className="panel editor">
        <div className="section-heading"><div><p className="kicker">{editor === "new" ? "NOVO SORTEIO" : "EDITAR RASCUNHO"}</p><h2>Prepare a cilada</h2></div><button className="text-button" onClick={() => setEditor(null)}>Fechar ×</button></div>
        <form onSubmit={save}>
          <label htmlFor="draw-name">Nome da conspiração</label><input id="draw-name" placeholder="Ex.: Novembro 2026" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={80} />
          <div className="people-head"><div><h3>Participantes adicionados por você</h3><p>Opcional. Salve o rascunho para gerar um link de inscrição e deixar o grupo pedir para entrar.</p></div><span className="count-badge">{people.length} pessoas</span></div>
          <div className="people-list">{people.map((person, index) => <div className="person-row" key={index}><span className="person-index">{String(index + 1).padStart(2, "0")}</span><input aria-label={`Nome da pessoa ${index + 1}`} placeholder="Nome" value={person.name} onChange={(event) => setPeople(people.map((p, i) => i === index ? { ...p, name: event.target.value } : p))} required /><input aria-label={`Email da pessoa ${index + 1}`} type="email" placeholder="email@exemplo.com" value={person.email} onChange={(event) => setPeople(people.map((p, i) => i === index ? { ...p, email: event.target.value } : p))} required /><button type="button" className="remove-button" aria-label={`Remover pessoa ${index + 1}`} onClick={() => setPeople(people.filter((_, i) => i !== index))}>×</button></div>)}</div>
          <button type="button" className="add-button" onClick={() => setPeople([...people, blank()])}>＋ Adicionar manualmente</button>
          <div className="form-actions"><button type="button" className="button secondary" onClick={() => setEditor(null)}>Cancelar</button><button className="button primary" disabled={busy}>{busy ? "Salvando..." : "Salvar rascunho"} <span>→</span></button></div>
        </form>
      </section>}
      <div className="draw-grid">{draws.length ? draws.map((draw) => {
        const pending = draw.signups.filter((entry) => entry.status === "pending");
        const rejected = draw.signups.filter((entry) => entry.status === "rejected");
        return <article className={`draw-card ${draw.status === "draft" ? "draft-card" : ""}`} key={draw.id}>
          <div className="card-top"><span className={`status ${draw.status}`}>{draw.status === "draft" ? "Rascunho" : draw.completed === draw.participants ? "Concluído" : "Publicado"}</span><span className="card-spark">✦</span></div>
          <h2>{draw.name}</h2><p className="card-meta">{draw.participants} participantes <span>·</span> {draw.status === "draft" ? `${pending.length} aguardando aprovação` : `${draw.completed} já sortearam`}</p>
          {draw.status === "draft" ? <>
            <div className="signup-link"><p className="kicker">LINK DE INSCRIÇÃO</p><p>Compartilhe agora para receber nomes e emails.</p><Link href={`/inscricao/${draw.id}`} target="_blank">Abrir página de inscrição ↗</Link><button className="button secondary" onClick={() => void copyLink(draw.id, "registration")}>Copiar link ↗</button></div>
            <div className="review-section"><h3>Pedidos de entrada <span>{pending.length}</span></h3>
              {pending.length ? pending.map((entry) => <div className="signup-row" key={entry.id}><div><strong>{entry.name}</strong><span>{entry.email}</span></div><div className="review-actions"><button className="button primary" disabled={busy} onClick={() => void review(draw.id, entry.id, "approve")}>Aprovar</button><button className="button secondary" disabled={busy} onClick={() => void review(draw.id, entry.id, "reject")}>Recusar</button></div></div>) : <p className="quiet-note">Ninguém pediu para entrar ainda. Desconfie do silêncio.</p>}
              {rejected.length > 0 && <details className="rejected-list"><summary>{rejected.length} inscrição{rejected.length === 1 ? " recusada" : " inscrições recusadas"}</summary>{rejected.map((entry) => <div className="signup-row" key={entry.id}><div><strong>{entry.name}</strong><span>{entry.email}</span></div><button className="button secondary" disabled={busy} onClick={() => void review(draw.id, entry.id, "approve")}>Aprovar</button></div>)}</details>}
            </div>
            <div className="approved-list"><h3>Lista aprovada <span>{draw.participants}</span></h3>{draw.participantsList.length ? draw.participantsList.map((person) => <div key={person.email}><strong>{person.name}</strong><span>{person.email}</span></div>) : <p className="quiet-note">A lista ainda está vazia.</p>}</div>
            <div className="card-actions"><button className="button secondary" onClick={() => start(draw)}>Editar lista</button><button className="button primary" disabled={busy || draw.participants < 2 || pending.length > 0} onClick={() => publish(draw)}>Publicar sorteio →</button></div>
            {(draw.participants < 2 || pending.length > 0) && <p className="publish-note">Para publicar, aprove pelo menos duas pessoas e revise todos os pedidos pendentes.</p>}
          </> : <><div className="progress"><span style={{ width: `${draw.completed / draw.participants * 100}%` }} /></div><div className="card-actions"><Link className="button secondary" href={`/s/${draw.id}`}>Abrir página ↗</Link><button className="button primary" onClick={() => void copyLink(draw.id, "participation")}>Copiar link ↗</button></div></>}
          <div className="delete-area">
            {deleteTarget === draw.id ? <div className="delete-confirm"><p><strong>Excluir “{draw.name}”?</strong> Participantes, inscrições e resultados serão apagados. Os links deixarão de funcionar.</p><label htmlFor={`delete-name-${draw.id}`}>Digite o nome do sorteio para confirmar</label><input id={`delete-name-${draw.id}`} value={deleteName} onChange={(event) => setDeleteName(event.target.value)} autoComplete="off" /><div className="delete-actions"><button className="button secondary" disabled={busy} onClick={() => { setDeleteTarget(null); setDeleteName(""); }}>Cancelar</button><button className="button danger-button" disabled={busy || deleteName !== draw.name} onClick={() => void deleteDraw(draw)}>{busy ? "Excluindo..." : "Excluir definitivamente"}</button></div></div> : <button className="text-button danger-text" disabled={busy} onClick={() => beginDelete(draw.id)}>Excluir sorteio</button>}
          </div>
        </article>;
      }) : <div className="empty-state"><div className="big-symbol">✦</div><h2>Nenhuma conspiração registrada.</h2><p>Crie um rascunho e compartilhe o link de inscrição. Deixe que os suspeitos façam o cadastro.</p><button className="button primary" onClick={() => start()}>Criar sorteio →</button></div>}</div>
    </div>}
  </main>;
}
