import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCheck, FiHeadphones, FiList, FiLock, FiLogOut, FiMessageCircle, FiMusic, FiPlus, FiRefreshCw, FiSend, FiUsers, FiWifi } from "react-icons/fi";
import { useRoom } from "../room/RoomContext";

const labels = { loading: "Preparando sua sala", idle: "Você está fora da sala", connecting: "Conectando...", connected: "Conectado à sala", reconnecting: "Reconectando...", error: "Sem conexão", unpaired: "Duo não formado" };

function Avatar({ member, online }) {
  return <div className="relative shrink-0">
    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-gray-700 bg-gray-800 text-sm font-semibold text-fuchsia-200">
      {member.profileImageUrl ? <img src={member.profileImageUrl} alt="" className="h-full w-full object-cover" /> : member.name?.trim().slice(0, 1).toUpperCase() || "?"}
    </div>
    <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-gray-950 ${online ? "bg-emerald-400" : "bg-gray-600"}`} />
  </div>;
}

export default function MusicRoom() {
  const { info, snapshot, status, error, joined, join, leave, send } = useRoom();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [hasUnread, setHasUnread] = useState(false);
  const retryMessage = useRef(null);
  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const followChat = useRef(true);
  const active = status === "connected";
  const connecting = ["loading", "connecting", "reconnecting"].includes(status);
  const messages = snapshot?.messages;
  const onlineIds = snapshot?.onlineUserIds || [];
  const onlineCount = onlineIds.length;

  useEffect(() => {
    if (followChat.current && chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  async function submit(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending || !active) return;
    inputRef.current?.focus();
    setSending(true);
    setSendError("");
    if (retryMessage.current?.text !== text) retryMessage.current = { text, id: crypto.randomUUID() };
    try {
      await send(text, retryMessage.current.id);
      setDraft("");
      retryMessage.current = null;
      followChat.current = true;
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    } catch (err) {
      if (err.name !== "AbortError") setSendError(err.message);
    } finally { setSending(false); }
  }

  if (status === "unpaired") return <div className="mx-auto max-w-xl rounded-3xl border border-gray-800 bg-gray-950 px-6 py-14 text-center">
    <FiUsers className="mx-auto mb-5 text-fuchsia-400" size={36} />
    <h1 className="mb-3 text-2xl font-bold">Uma sala feita para dois</h1>
    <p className="mb-8 leading-relaxed text-gray-400">Forme seu Duo para ter um espaço para conversar e compartilhar música com alguém especial.</p>
    <Link to="/convidar" className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-5 py-3 font-semibold hover:bg-fuchsia-500">Convidar alguém <FiArrowRight /></Link>
    <Link to="/aceitar" className="mt-5 block text-sm text-fuchsia-300 hover:text-white">Já recebeu um convite? Aceitar convite</Link>
  </div>;

  return <div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-400">Seu espaço a dois</p>
        <h1 className="text-3xl font-bold tracking-tight">Sala musical<span className="text-fuchsia-500">.</span></h1>
        <p className="mt-2 text-sm text-gray-400">A conversa de vocês também faz parte da trilha sonora.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span role="status" className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${active ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-gray-700 bg-gray-800 text-gray-300"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400" : connecting ? "animate-pulse bg-amber-300" : "bg-gray-500"}`} />{labels[status]}
        </span>
        {joined ? <button onClick={leave} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:border-gray-500 hover:text-white"><FiLogOut /> Sair da sala</button>
          : <button onClick={join} disabled={connecting} className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-2.5 text-sm font-semibold hover:bg-fuchsia-500 disabled:cursor-wait disabled:opacity-50">{status === "error" ? <FiRefreshCw /> : <FiHeadphones />}{connecting ? "Aguarde..." : status === "error" ? "Tentar novamente" : "Entrar na sala"}</button>}
      </div>
    </header>

    {error && <p role="alert" className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{error}</p>}

    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
      <div className="min-w-0 space-y-5">
        <section aria-label="Participantes do Duo" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-800 bg-gray-950/60 px-5 py-4">
          <div className="flex flex-wrap gap-6">
            {info?.members.map((member) => <div key={member.id} className="flex min-w-0 items-center gap-3">
              <Avatar member={member} online={onlineIds.includes(member.id)} />
              <div><p className="max-w-40 truncate text-sm font-semibold">{member.id === info.currentUserId ? `${member.name.split(" ")[0]} (você)` : member.name.split(" ")[0]}</p>
                <p className={`mt-0.5 text-xs ${onlineIds.includes(member.id) ? "text-emerald-400" : "text-gray-500"}`}>{onlineIds.includes(member.id) ? "Na sala" : snapshot ? "Fora da sala" : "Presença indisponível"}</p></div>
            </div>)}
            {!info && <p className="text-sm text-gray-400">Carregando seu Duo...</p>}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-fuchsia-500/15 bg-gradient-to-br from-purple-950 via-gray-950 to-gray-950 px-6 pb-8 pt-6 text-center">
          <div className="flex items-center justify-between text-xs text-purple-200/70"><span className="inline-flex items-center gap-2"><FiHeadphones /> O som de vocês</span><span className="inline-flex items-center gap-1.5"><FiLock /> Sala privada</span></div>
          <div className="relative mx-auto mb-7 mt-9 flex h-44 w-44 items-center justify-center rounded-full border border-white/10 bg-gray-950 shadow-[0_0_70px_rgba(192,38,211,0.16)] sm:h-52 sm:w-52" aria-hidden="true">
            <div className="absolute inset-3 rounded-full border border-white/5" /><div className="absolute inset-6 rounded-full border border-white/5" /><div className="absolute inset-9 rounded-full border border-white/5" />
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-800 shadow-lg"><FiMusic size={30} /></div>
          </div>
          <h2 className="text-xl font-semibold sm:text-2xl">Toda boa trilha começa com vocês</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-400">{active ? "Sua sala está aberta. Use o chat para trocar ideias e combinar a próxima música." : "Entre na sala e encontre seu Duo em um espaço só de vocês."}</p>
          {!active && !connecting && <button onClick={join} className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-purple-950 transition hover:bg-purple-100"><FiHeadphones /> Vamos nos conectar</button>}
          {active && <p className="mt-6 inline-flex items-center gap-2 text-sm text-fuchsia-300"><FiWifi />{onlineCount === 2 ? "Vocês dois estão por aqui" : "Esperando seu Duo entrar"}</p>}
          <div className="mx-auto mt-8 max-w-md rounded-xl border border-white/5 bg-white/[0.03] p-3 text-xs leading-relaxed text-gray-400"><span className="font-medium text-purple-200">Reprodução conjunta em breve.</span> Por enquanto, o player do Spotify toca apenas para você.</div>
        </section>

        <section className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5">
          <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-semibold"><FiList className="text-fuchsia-400" size={18} /> Fila compartilhada</h2><span className="rounded-full bg-gray-800 px-2.5 py-1 text-[11px] text-gray-400">Em breve</span></div>
          <div className="mt-5 flex items-center gap-4 rounded-xl border border-dashed border-gray-700/70 p-4"><div className="rounded-lg bg-gray-800 p-3 text-gray-500"><FiPlus size={20} /></div><p className="text-sm leading-relaxed text-gray-500">As músicas escolhidas por vocês vão aparecer aqui.</p></div>
        </section>


      </div>

      <section aria-label="Chat do Duo" className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 xl:sticky xl:top-0">
        <header className="flex items-center justify-between border-b border-gray-800 px-5 py-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-fuchsia-500/10 p-2.5 text-fuchsia-400"><FiMessageCircle size={20} /></span><div><h2 className="font-semibold">Conversa do Duo</h2><p className="mt-0.5 text-xs text-gray-500">{active ? `${onlineCount} de 2 na sala` : "Um espaço para vocês"}</p></div></div><FiLock size={14} className="text-gray-600" /></header>
        <div ref={chatRef} role="log" aria-label="Mensagens da conversa" aria-live="polite" onScroll={(event) => { const element = event.currentTarget; followChat.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80; if (followChat.current) setHasUnread(false); else setHasUnread(true); }} className="h-[360px] space-y-4 overflow-y-auto px-4 py-5 xl:h-[470px]">
          {!messages?.length ? <div className="flex h-full flex-col items-center justify-center px-5 text-center"><div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-800 bg-gray-900 text-gray-500"><FiMessageCircle size={28} /></div><h3 className="text-sm font-medium text-gray-200">{active ? "Dê o primeiro oi" : "A conversa começa aqui"}</h3><p className="mt-2 text-xs leading-relaxed text-gray-500">{active ? "Um pedido de música, uma lembrança ou só um “saudade”. Esse espaço é de vocês." : "Entre na sala para conversar com seu Duo em tempo real."}</p></div>
            : messages.map((message) => { const mine = message.senderId === info?.currentUserId; return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-2xl px-3.5 py-3 ${mine ? "rounded-br-sm bg-fuchsia-700/80" : "rounded-bl-sm bg-gray-800"}`}>
              {!mine && <p className="mb-1 text-xs font-medium text-fuchsia-300">{message.senderName}</p>}<p className="whitespace-pre-wrap break-words text-sm leading-relaxed [overflow-wrap:anywhere]">{message.text}</p><div className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-fuchsia-200" : "text-gray-500"}`}><time dateTime={message.sentAt}>{new Date(message.sentAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time>{mine && <FiCheck aria-label="Mensagem enviada" />}</div>
            </div></div>; })}
        </div>
        {hasUnread && <button className="py-2 text-xs text-fuchsia-300 hover:text-white" onClick={() => { followChat.current = true; chatRef.current.scrollTop = chatRef.current.scrollHeight; setHasUnread(false); }}>Ir para as últimas mensagens ↓</button>}
        <form onSubmit={submit} className="border-t border-gray-800 p-4">
          {sendError && <p role="alert" className="mb-3 text-xs leading-relaxed text-red-300">{sendError}</p>}
          <div aria-label="Emojis rápidos" className="mb-3 flex flex-wrap gap-2">
            {[['❤️', 'Amor'], ['😍', 'Apaixonado'], ['😂', 'Rindo'], ['🎶', 'Música'], ['🔥', 'Fogo'], ['👏', 'Palmas']].map(([emoji, label]) => <button key={emoji} type="button" aria-label={`Adicionar emoji: ${label}`} disabled={!active || sending || draft.length + emoji.length > 800} onClick={() => { setDraft((value) => value + emoji); inputRef.current?.focus(); }} className="rounded-lg border border-gray-800 px-2.5 py-1.5 text-lg hover:border-fuchsia-500 hover:bg-gray-800 disabled:opacity-30">{emoji}</button>)}
          </div>
          <label htmlFor="room-message" className="sr-only">Mensagem para seu Duo</label>
          <div className="flex items-end gap-2 rounded-xl border border-gray-700 bg-gray-900 p-2 focus-within:border-fuchsia-500/70">
            <textarea ref={inputRef} id="room-message" rows={2} maxLength={800} value={draft} disabled={!active} readOnly={sending} onChange={(event) => { setDraft(event.target.value); setSendError(""); }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form.requestSubmit(); } }} placeholder={active ? "Escreva algo para seu Duo..." : "Entre na sala para conversar"} className="min-w-0 flex-1 resize-none bg-transparent p-1 text-sm text-gray-100 outline-none placeholder:text-gray-600 disabled:cursor-not-allowed" />
            <button type="submit" disabled={!active || sending || !draft.trim()} aria-label={sending ? "Enviando mensagem" : "Enviar mensagem"} className="rounded-lg bg-fuchsia-600 p-3 text-white hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-600"><FiSend size={17} /></button>
          </div>
          <div className="mt-2 flex justify-between gap-2 text-[10px] text-gray-600"><span>Enter envia · Shift + Enter pula linha</span><span>{draft.length}/800</span></div>
          <p className="mt-3 text-center text-[10px] leading-relaxed text-gray-600">Conversa temporária · últimas 30 mensagens</p>
        </form>
      </section>
    </div>
  </div>;
}