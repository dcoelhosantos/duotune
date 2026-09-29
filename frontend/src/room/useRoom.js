import { useCallback, useEffect, useRef, useState } from "react";
import { Client, TickerStrategy } from "@stomp/stompjs";
import { getSessionExpiration } from "../auth/useSession";
import { roomApi } from "./api";

function storedDuoId() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}").duoId ?? null;
  } catch {
    return null;
  }
}

export function useRoomConnection() {
  const [clientId] = useState(() => crypto.randomUUID());
  const [info, setInfo] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [wanted, setWanted] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const clientRef = useRef(null);
  const sendRef = useRef(null);
  const endedRef = useRef(false);

  useEffect(() => {
    let previousDuoId = storedDuoId();
    function updateDuo() {
      const nextDuoId = storedDuoId();
      if (nextDuoId === previousDuoId) return;
      previousDuoId = nextDuoId;
      // uma sessão STOMP armazena em cache seu Duo no momento do CONNECT.
      // nunca o reutilizar para um novo vínculo.
      void clientRef.current?.deactivate();
      clientRef.current = null;
      endedRef.current = false;
      setWanted(false);
      setInfo(null);
      setSnapshot(null);
      setError("");
      setStatus("loading");
      setAttempt((value) => value + 1);
    }
    window.addEventListener("profile-updated", updateDuo);
    window.addEventListener("storage", updateDuo);
    return () => {
      window.removeEventListener("profile-updated", updateDuo);
      window.removeEventListener("storage", updateDuo);
    };
  }, []);

  useEffect(() => {
    if (!wanted && endedRef.current) return;
    let active = true;
    let stopped = false;
    let generation = 0;
    let failures = 0;
    let poll;
    let initialRefresh;
    let stableConnection;
    let client;
    const abort = new AbortController();
    const clearPolling = () => {
      clearInterval(poll);
      clearTimeout(initialRefresh);
      clearTimeout(stableConnection);
    };
    const apply = (state) =>
      setSnapshot((previous) =>
        !previous || state.version >= previous.version ? state : previous,
      );
    function endSession(message, nextStatus = "error") {
      if (!active || stopped) return;
      stopped = true;
      endedRef.current = true;
      generation++;
      clearPolling();
      abort.abort();
      sendRef.current?.abort();
      void client?.deactivate();
      clientRef.current = null;
      setWanted(false);
      setStatus(nextStatus);
      setError(message);
    }
    async function refresh() {
      const currentGeneration = generation;
      try {
        const next = await roomApi("", { signal: abort.signal });
        if (!active || stopped || currentGeneration !== generation) return;
        setInfo(next);
        apply(next.state);
      } catch (err) {
        if (
          !active ||
          stopped ||
          currentGeneration !== generation ||
          err.name === "AbortError"
        )
          return;
        if ([401, 403, 409].includes(err.status)) {
          endSession(err.message, err.status === 409 ? "unpaired" : "error");
          return;
        }
        setError(err.message);
      }
    }
    async function start() {
      try {
        const current = await roomApi("", { signal: abort.signal });
        if (!active) return;
        setInfo(current);
        setSnapshot(current.state);
        setError("");
        if (!wanted) {
          setStatus("idle");
          return;
        }
        const url = new URL(
          import.meta.env.VITE_ROOM_WS_URL || "/ws",
          window.location.href,
        );
        url.protocol =
          url.protocol === "https:" || url.protocol === "wss:" ? "wss:" : "ws:";
        client = new Client({
          brokerURL: url.href,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          heartbeatStrategy: TickerStrategy.Worker,
          discardWebsocketOnCommFailure: true,
          reconnectDelay: 4000,
          connectionTimeout: 10000,
          beforeConnect: () => {
            if (!active || stopped) {
              void client.deactivate();
              return;
            }
            if (getSessionExpiration() <= Date.now() || ++failures > 5) {
              endSession(
                getSessionExpiration() <= Date.now()
                  ? "Sua sessão expirou. Entre novamente."
                  : "A conexão com a sala foi encerrada após várias tentativas. Entre na sala novamente.",
              );
              return;
            }
            client.connectHeaders = {
              "room-client-id": clientId,
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            };
          },
          onConnect: () => {
            if (!active || stopped) {
              void client.deactivate();
              return;
            }
            generation++;
            setSnapshot(null);
            client.subscribe(`/topic/duos/${current.duoId}/room`, (frame) => {
              if (!active || stopped) return;
              try {
                const state = JSON.parse(frame.body);
                if (
                  state.duoId === current.duoId &&
                  Array.isArray(state.messages) &&
                  Array.isArray(state.onlineUserIds)
                )
                  apply(state);
              } catch {
                setError(
                  "Não foi possível atualizar a sala. Reconecte para continuar.",
                );
              }
            });
            setStatus("connected");
            setError("");
            clearPolling();
            // redefine o número de tentativas apenas após uma conexão estável, não apenas quando estiver conectado.
            stableConnection = setTimeout(() => {
              failures = 0;
            }, 30000);
            void refresh();
            initialRefresh = setTimeout(refresh, 1000);
            poll = setInterval(refresh, 10000);
          },
          onStompError: (frame) => {
            if (!active || stopped) return;
            const message = frame.body || frame.headers.message;
            const sessionClosed = [frame.body, frame.headers.message].some(
              (value) => /^session closed\.?$/i.test(value?.trim() || ""),
            );
            if (sessionClosed && getSessionExpiration() > Date.now()) {
              generation++;
              clearPolling();
              setStatus("reconnecting");
              setError("Conexão interrompida. Estamos tentando reconectar...");
              // mantém o cliente ativo: fechar o transporte aciona seu agendador de tentativas.
              client.forceDisconnect();
              return;
            }
            endSession(
              getSessionExpiration() <= Date.now()
                ? "Sua sessão expirou. Entre novamente."
                : message ||
                    "Sua sessão na sala foi encerrada. Entre na sala novamente.",
            );
          },
          onWebSocketClose: () => {
            generation++;
            clearPolling();
            if (active && !stopped) {
              setStatus("reconnecting");
              setError("Conexão interrompida. Estamos tentando reconectar...");
            }
          },
        });
        clientRef.current = client;
        client.activate();
      } catch (err) {
        if (!active || err.name === "AbortError") return;
        endSession(err.message, err.status === 409 ? "unpaired" : "error");
      }
    }
    void start();
    return () => {
      active = false;
      stopped = true;
      abort.abort();
      generation++;
      clearPolling();
      sendRef.current?.abort();
      void client?.deactivate();
      clientRef.current = null;
    };
  }, [wanted, attempt, clientId]);

  // Consultar presença não assina o canal nem coloca este usuário na sala.
  useEffect(() => {
    if (wanted || !info?.duoId || status === "unpaired") return;
    let active = true;
    let pending = false;
    const abort = new AbortController();
    async function checkPresence() {
      if (pending || document.visibilityState === "hidden") return;
      pending = true;
      try {
        const current = await roomApi("", { signal: abort.signal });
        if (active) setSnapshot(current.state);
      } catch (err) {
        // Não anunciar presença antiga quando não foi possível verificá-la.
        if (active && err.name !== "AbortError") setSnapshot(null);
      } finally {
        pending = false;
      }
    }
    void checkPresence();
    const timer = setInterval(checkPresence, 10000);
    document.addEventListener("visibilitychange", checkPresence);
    return () => {
      active = false;
      abort.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", checkPresence);
    };
  }, [wanted, info?.duoId, status]);

  function join() {
    endedRef.current = false;
    setError("");
    setStatus("connecting");
    setWanted(true);
    setAttempt((value) => value + 1);
  }
  function leave() {
    endedRef.current = false;
    setError("");
    setStatus("idle");
    setWanted(false);
  }
  async function send(text, clientId) {
    if (!clientRef.current?.connected || status !== "connected")
      throw new Error("Reconecte à sala antes de enviar.");
    const abort = new AbortController();
    sendRef.current = abort;
    const state = await roomApi("/messages", {
      method: "POST",
      body: JSON.stringify({ text, clientId }),
      signal: abort.signal,
    });
    if (!abort.signal.aborted)
      setSnapshot((previous) =>
        !previous || state.version >= previous.version ? state : previous,
      );
  }
  const updateSnapshot = useCallback((state) => {
    setSnapshot((previous) =>
      !previous || state.version >= previous.version ? state : previous,
    );
  }, []);
  return {
    info,
    snapshot,
    status,
    error,
    joined: wanted,
    join,
    leave,
    send,
    updateSnapshot,
    clientId,
  };
}
