import { useEffect, useRef, useState } from "react";
import { SpotifyContext } from "./SpotifyContext";
import { loadSpotifySdk, spotifyApi } from "./api";

function spotifyErrorMessage(error) {
  return /^session closed\.?$/i.test(error?.message?.trim() || "")
    ? "A conexão do player com o Spotify foi encerrada. Recarregue o player para ouvir novamente."
    : error.message;
}

export default function SpotifyProvider({ children }) {
  const [needsAuthorization, setNeedsAuthorization] = useState(false);
  const [playerVisible, setPlayerVisible] = useState(true);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState(null);
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const previousVolumeRef = useRef(0.5);
  const playerRef = useRef(null);
  const commandRef = useRef(false);

  useEffect(() => {
    let disposed = false;
    let player;
    async function initialize() {
      try {
        const status = await spotifyApi("status");
        if (disposed) return;
        setConnected(status.connected);
        if (!status.connected) return;
        const Spotify = await loadSpotifySdk();
        if (disposed) return;
        player = new Spotify.Player({
          name: "DuoTune",
          volume: 0.5,
          getOAuthToken: (callback) => {
            spotifyApi("token")
              .then((data) => {
                if (!disposed) callback(data.access_token);
              })
              .catch((err) => {
                if (!disposed) {
                  setError(spotifyErrorMessage(err));
                  setNeedsAuthorization(err.status === 409);
                }
              });
          },
        });
        playerRef.current = player;
        player.addListener("ready", ({ device_id: activeDeviceId }) => {
          if (!disposed) {
            setDeviceId(activeDeviceId);
            setError("");
            setNeedsAuthorization(false);
          }
        });
        player.addListener("not_ready", () => {
          if (!disposed) {
            setDeviceId(null);
            setState(null);
            setError(
              "O player ficou offline. Recarregue para iniciar um novo dispositivo.",
            );
          }
        });
        player.addListener("player_state_changed", (next) => {
          if (!disposed) setState(next);
        });
        const messages = {
          authentication_error:
            "Não foi possível autenticar o player. Se o erro persistir após recarregar, reconecte o Spotify no perfil.",
          initialization_error:
            "Este navegador não conseguiu iniciar o player. Verifique o suporte a conteúdo protegido.",
          account_error:
            "É necessário Spotify Premium para ouvir músicas completas.",
          playback_error:
            "Não foi possível reproduzir esta música. Tente outra faixa.",
          autoplay_failed:
            "O navegador bloqueou o áudio. Clique em reproduzir para continuar.",
        };
        Object.entries(messages).forEach(([event, message]) =>
          player.addListener(event, () => {
            if (!disposed) {
              setError(message);
              if (
                [
                  "authentication_error",
                  "account_error",
                  "initialization_error",
                ].includes(event)
              )
                setDeviceId(null);
            }
          }),
        );
        const success = await player.connect();
        if (!success && !disposed)
          setError("Não foi possível conectar o player. Tente novamente.");
      } catch (err) {
        if (!disposed) {
          setError(spotifyErrorMessage(err));
          setNeedsAuthorization(err.status === 409);
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    }
    initialize();
    return () => {
      disposed = true;
      player?.disconnect();
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    let disposed = false;
    let pending = false;
    const timer = setInterval(async () => {
      if (pending || commandRef.current || !playerRef.current) return;
      pending = true;
      try {
        const next = await playerRef.current.getCurrentState();
        if (!disposed && !commandRef.current) setState(next);
      } catch {
        // Mantém o último estado conhecido; os eventos do SDK informam falhas de conexão.
      } finally {
        pending = false;
      }
    }, 1000);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [deviceId]);

  async function changeVolume(value) {
    const player = playerRef.current;
    if (!deviceId || !player || commandRef.current || !Number.isFinite(value))
      return;
    const next = Math.max(0, Math.min(1, value));
    commandRef.current = true;
    setBusy(true);
    setError("");
    try {
      // Aplica apenas o valor confirmado ao soltar o controle.
      await player.setVolume(next);
      if (playerRef.current !== player) return;
      setVolume(next);
      if (next > 0) previousVolumeRef.current = next;
    } catch {
      setError("Não foi possível ajustar o volume neste navegador.");
    } finally {
      commandRef.current = false;
      setBusy(false);
    }
  }

  function toggleMute() {
    void changeVolume(volume > 0 ? 0 : previousVolumeRef.current);
  }

  async function seekTo(position, trackId) {
    const player = playerRef.current;
    if (
      !deviceId ||
      !player ||
      commandRef.current ||
      !Number.isFinite(position)
    )
      return;
    commandRef.current = true;
    setBusy(true);
    setError("");
    try {
      const current = await player.getCurrentState();
      if (
        !current ||
        current.track_window.current_track.id !== trackId ||
        current.disallows?.seeking
      )
        return;
      const target = Math.max(
        0,
        Math.min(Math.round(position), Math.max(0, current.duration - 1)),
      );
      await player.seek(target);
      if (playerRef.current === player)
        setState(await player.getCurrentState());
    } catch {
      setError(
        "Não foi possível alterar a posição da música. Tente novamente.",
      );
    } finally {
      commandRef.current = false;
      setBusy(false);
    }
  }

  async function closePlayer() {
    if (commandRef.current) return;
    commandRef.current = true;
    setBusy(true);
    try {
      const player = playerRef.current;
      const current = await player?.getCurrentState();
      if (current && !current.paused) await player.pause();
      setPlayerVisible(false);
    } catch {
      setError(
        "Não foi possível pausar a música. Tente fechar o player novamente.",
      );
    } finally {
      commandRef.current = false;
      setBusy(false);
    }
  }

  async function playTrack(track) {
    setPlayerVisible(true);
    if (!deviceId || commandRef.current) return;
    commandRef.current = true;
    setBusy(true);
    setError("");
    try {
      await playerRef.current.activateElement();
      const current = await playerRef.current.getCurrentState();
      const sameTrack = current?.track_window.current_track.id === track.id;
      const pause = sameTrack && !current.paused;
      const body =
        pause || sameTrack
          ? undefined
          : JSON.stringify({ uris: [`spotify:track:${track.id}`] });
      async function send(force) {
        const data = await spotifyApi(
          force ? "refresh" : "token",
          force ? { method: "POST" } : {},
        );
        return fetch(
          `https://api.spotify.com/v1/me/player/${pause ? "pause" : "play"}?device_id=${encodeURIComponent(deviceId)}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${data.access_token}`,
              "Content-Type": "application/json",
            },
            body,
          },
        );
      }
      let response = await send(false);
      if (response.status === 401) response = await send(true);
      if (!response.ok) {
        const messages = {
          403: "A reprodução exige Spotify Premium e acesso autorizado ao aplicativo.",
          404: "O dispositivo de reprodução ficou indisponível. Recarregue para iniciar outro.",
          429: "O Spotify recebeu muitas solicitações. Aguarde um pouco antes de tentar novamente.",
        };
        throw new Error(
          messages[response.status] ||
            "Não foi possível reproduzir a música. Tente novamente.",
        );
      }
    } catch (err) {
      if (/^session closed\.?$/i.test(err?.message?.trim() || "")) {
        setDeviceId(null);
        setState(null);
      }
      setError(spotifyErrorMessage(err));
      setNeedsAuthorization(err.status === 409);
    } finally {
      commandRef.current = false;
      setBusy(false);
    }
  }

  const currentTrack = state?.track_window.current_track;
  return (
    <SpotifyContext.Provider
      value={{
        needsAuthorization,
        playerVisible,
        closePlayer,
        connected,
        loading,
        deviceId,
        currentTrack,
        isPlaying: !!state && !state.paused,
        error,
        busy,
        playTrack,
        volume,
        changeVolume,
        toggleMute,
        seekTo,
        position: state?.position ?? 0,
        duration: state?.duration ?? 0,
        canSeek: !!state && !state.disallows?.seeking,
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
}
