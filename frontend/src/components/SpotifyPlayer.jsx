import { useState } from "react";
import {
  FiX,
  FiSkipForward,
  FiMusic,
  FiPause,
  FiPlay,
  FiVolume1,
  FiVolume2,
  FiVolumeX,
} from "react-icons/fi";
import SpotifyProgress from "./SpotifyProgress";
import { Link } from "react-router-dom";
import { useSpotify } from "../spotify/SpotifyContext";
import { useRoom } from "../room/RoomContext";

export default function SpotifyPlayer() {
  const {
    joined,
    status: roomStatus,
    error: roomError,
    leave,
    snapshot,
    track,
    position: roomPosition,
    bothReady,
    needsAudioAction,
    enableAudio,
    playbackError,
    playbackBusy,
    control,
  } = useRoom();
  const {
    needsAuthorization,
    playerVisible,
    closePlayer,
    connected,
    loading,
    deviceId,
    currentTrack: personalTrack,
    isPlaying: personalPlaying,
    error,
    busy,
    playTrack,
    seekTo,
    position: personalPosition,
    duration: personalDuration,
    canSeek,
    volume,
    changeVolume,
    toggleMute,
  } = useSpotify();
  const [volumeDraft, setVolumeDraft] = useState(null);
  function commitVolume() {
    if (volumeDraft === null || busy || !deviceId) return;
    void changeVolume(volumeDraft / 100);
    setVolumeDraft(null);
  }

  const currentTrack = joined
    ? track
      ? {
          id: track.id,
          name: track.title,
          artists: [{ name: track.artist }],
          album: { images: [{ url: track.imageUrl }] },
        }
      : null
    : personalTrack;
  const isPlaying = joined
    ? roomStatus === "connected" && !!snapshot?.playback?.playing
    : personalPlaying;
  const position = joined ? roomPosition : personalPosition;
  const duration = joined ? track?.durationMs || 0 : personalDuration;
  const cover = currentTrack?.album?.images?.[0]?.url;
  const volumePercent = volumeDraft ?? Math.round(volume * 100);
  if (!playerVisible && !joined && roomStatus !== "error") return null;
  return (
    <footer
      className="shrink-0 border-t border-gray-800 bg-gray-950 relative px-4 sm:px-8 pr-12 sm:pr-16 py-4 shadow-lg"
      aria-label="Player do Spotify"
    >
      {!joined && roomStatus === "error" && (
        <p role="alert" className="mb-3 text-sm text-amber-300">
          {roomError}{" "}
          <Link to="/sala" className="underline">
            Abrir sala
          </Link>
        </p>
      )}
      {joined && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3 text-xs">
          <Link
            to="/sala"
            className={
              roomStatus === "connected" ? "text-emerald-300" : "text-amber-300"
            }
          >
            {roomStatus === "connected"
              ? "● Conectado à sala"
              : ["connecting", "reconnecting"].includes(roomStatus)
                ? "● Conectando à sala..."
                : "● Sala sem conexão — abrir sala"}
          </Link>
          <span className="text-gray-400">
            {bothReady
              ? "Reprodução compartilhada"
              : "Aguardando os dois players"}
          </span>
          <button
            type="button"
            onClick={leave}
            className="cursor-pointer text-red-400 hover:text-red-300 focus-visible:outline focus-visible:outline-red-400"
          >
            Sair da sala
          </button>
        </div>
      )}
      {!joined && (
        <button
          type="button"
          disabled={busy}
          onClick={closePlayer}
          aria-label="Fechar player e pausar música"
          title="Fechar player"
          className="absolute top-3 right-3 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-40"
        >
          <FiX size={18} />
        </button>
      )}
      {joined && needsAudioAction && (
        <button
          onClick={enableAudio}
          disabled={roomStatus !== "connected"}
          className="mb-3 cursor-pointer text-sm text-fuchsia-300 underline disabled:opacity-40"
        >
          Tentar ativar áudio da sala
        </button>
      )}
      {joined && playbackError && (
        <p role="alert" className="mb-3 text-sm text-red-300">
          {playbackError}
        </p>
      )}
      {error && (
        <p role="alert" className="text-red-300 text-sm mb-3">
          {error}{" "}
          {needsAuthorization ? (
            <Link to="/perfil" className="underline">
              Reconectar com Spotify
            </Link>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => window.location.reload()}
              className="underline disabled:opacity-50"
            >
              Recarregar player
            </button>
          )}
        </p>
      )}
      {loading ? (
        <p className="text-sm text-gray-400">Carregando Spotify...</p>
      ) : !connected ? (
        <Link
          to="/perfil"
          className="flex items-center gap-3 text-sm text-fuchsia-300"
        >
          <FiMusic />
          Conecte o Spotify no perfil para ouvir músicas completas.
        </Link>
      ) : (
        <div className="flex flex-wrap items-center gap-4 lg:gap-6">
          <div className="flex items-center gap-3 min-w-0 flex-1 basis-40">
            <div className="w-12 h-12 rounded-lg bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center">
              {cover ? (
                <img
                  src={cover}
                  alt="Capa do álbum"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiMusic className="text-fuchsia-400" size={22} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {currentTrack?.name || "Sua próxima música espera por você"}
              </p>
              <p className="text-xs text-gray-400 truncate mt-1">
                {currentTrack
                  ? currentTrack.artists.map((artist) => artist.name).join(", ")
                  : deviceId
                    ? "Escolha uma faixa na busca"
                    : "Conectando ao Spotify..."}
              </p>
            </div>
          </div>
          <button
            disabled={
              joined
                ? !bothReady || playbackBusy || !currentTrack
                : !deviceId || busy || !currentTrack
            }
            onClick={() =>
              joined
                ? control(isPlaying ? "PAUSE" : "PLAY")
                : playTrack(currentTrack)
            }
            aria-label={isPlaying ? "Pausar música" : "Reproduzir música"}
            className="w-11 h-11 rounded-full bg-white text-gray-950 flex items-center justify-center hover:bg-fuchsia-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {isPlaying ? (
              <FiPause size={21} />
            ) : (
              <FiPlay size={21} className="ml-0.5" />
            )}
          </button>
          {joined && (
            <button
              onClick={() => control("NEXT")}
              disabled={!bothReady || playbackBusy || !currentTrack}
              aria-label="Próxima música da fila"
              className="cursor-pointer rounded-full p-3 text-white hover:bg-gray-800 disabled:opacity-40"
            >
              <FiSkipForward size={22} />
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              disabled={!deviceId || busy}
              onClick={toggleMute}
              aria-label={volume === 0 ? "Ativar som" : "Silenciar"}
              aria-pressed={volume === 0}
              title={volume === 0 ? "Ativar som" : "Silenciar"}
              className="p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-40"
            >
              {volume === 0 ? (
                <FiVolumeX size={20} />
              ) : volume < 0.5 ? (
                <FiVolume1 size={20} />
              ) : (
                <FiVolume2 size={20} />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={volumePercent}
              disabled={!deviceId || busy}
              onChange={(event) => setVolumeDraft(Number(event.target.value))}
              onPointerDown={(event) =>
                event.currentTarget.setPointerCapture(event.pointerId)
              }
              onPointerUp={commitVolume}
              onKeyUp={commitVolume}
              onPointerCancel={() => setVolumeDraft(null)}
              onBlur={commitVolume}
              aria-label="Volume"
              aria-valuetext={`${volumePercent}%`}
              className="w-20 sm:w-24 accent-fuchsia-500 touch-none cursor-pointer disabled:opacity-40"
            />
            <span className="w-9 text-right text-xs tabular-nums text-gray-400">
              {volumePercent}%
            </span>
          </div>
        </div>
      )}
      {currentTrack && (
        <SpotifyProgress
          key={currentTrack.id}
          position={position}
          duration={duration}
          disabled={
            joined ? !bothReady || playbackBusy : !deviceId || busy || !canSeek
          }
          onSeek={(target) =>
            joined
              ? control("SEEK", Math.min(target, duration - 1))
              : seekTo(target, currentTrack.id)
          }
        />
      )}
    </footer>
  );
}
