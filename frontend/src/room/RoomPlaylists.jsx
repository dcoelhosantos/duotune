import { useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiMusic, FiX } from "react-icons/fi";
import { playlistApi } from "../playlists/api";
import { useRoom } from "./RoomContext";

export default function RoomPlaylists({ onClose, initialPlaylist = null }) {
  const { addPlaylist, playbackBusy, playbackError, status, snapshot } =
    useRoom();
  const dialog = useRef(null);
  const [lists, setLists] = useState(null);
  const [chosen, setChosen] = useState(initialPlaylist);
  const [details, setDetails] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const available = Math.max(0, 99 - (snapshot?.queue?.length || 0));

  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    const load = chosen
      ? playlistApi("/" + chosen.id, { signal: abort.signal }).then((data) => {
          if (abort.signal.aborted) return;
          setDetails(data);
          setSelected(
            new Set(data.tracks.map((track) => track.trackSpotifyId)),
          );
        })
      : Promise.all([
          playlistApi("", { signal: abort.signal }),
          playlistApi("/duo/list", { signal: abort.signal }),
        ]).then(([mine, partner]) => {
          if (!abort.signal.aborted) setLists({ mine, partner });
        });
    load.catch((err) => {
      if (!abort.signal.aborted)
        setError(err.message || "Não foi possível carregar as playlists.");
    });
    return () => abort.abort();
  }, [chosen, attempt]);

  function choose(playlist) {
    setChosen(playlist);
    setDetails(null);
    setSelected(new Set());
    setError("");
    setSubmitted(false);
  }

  function toggle(id) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    if (
      status !== "connected" ||
      !selected.size ||
      selected.size > available ||
      playbackBusy
    )
      return;
    setSubmitted(true);
    if (await addPlaylist(chosen.id, [...selected])) onClose();
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="room-playlists-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!playbackBusy) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !playbackBusy) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 p-0 text-white shadow-2xl backdrop:bg-black/70"
    >
      <div className="flex max-h-[85dvh] flex-col">
        <header className="flex items-center gap-3 border-b border-gray-800 p-5">
          {chosen && !initialPlaylist && (
            <button
              type="button"
              aria-label="Voltar às playlists"
              disabled={playbackBusy}
              onClick={() => choose(null)}
              className="cursor-pointer rounded-lg p-2 hover:bg-gray-800 disabled:opacity-40"
            >
              <FiArrowLeft />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2
              id="room-playlists-title"
              className="truncate text-lg font-semibold"
            >
              {chosen ? chosen.name : "Adicionar playlist"}
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              {chosen
                ? "Escolha as músicas que vocês querem ouvir."
                : "Escolha uma playlist sua ou do seu Duo."}
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar playlists"
            disabled={playbackBusy}
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 hover:bg-gray-800 disabled:opacity-40"
          >
            <FiX size={20} />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto p-5">
          {error ? (
            <p role="alert" className="text-sm text-red-300">
              {error}{" "}
              <button
                type="button"
                className="cursor-pointer underline"
                onClick={() => {
                  setError("");
                  setAttempt((value) => value + 1);
                }}
              >
                Tentar novamente
              </button>
            </p>
          ) : chosen ? (
            !details ? (
              <p role="status" className="text-sm text-gray-400">
                Carregando músicas...
              </p>
            ) : !details.tracks.length ? (
              <p className="text-sm text-gray-400">Esta playlist está vazia.</p>
            ) : (
              <>
                <label className="mb-4 flex cursor-pointer items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    disabled={playbackBusy}
                    checked={selected.size === details.tracks.length}
                    onChange={(event) =>
                      setSelected(
                        event.target.checked
                          ? new Set(
                              details.tracks.map(
                                (track) => track.trackSpotifyId,
                              ),
                            )
                          : new Set(),
                      )
                    }
                    className="h-4 w-4 accent-fuchsia-500"
                  />
                  Selecionar todas ({details.tracks.length})
                </label>
                <ul className="space-y-2">
                  {details.tracks.map((track) => (
                    <li key={track.trackSpotifyId}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-gray-800/70 p-3 hover:bg-gray-800">
                        <input
                          type="checkbox"
                          disabled={playbackBusy}
                          checked={selected.has(track.trackSpotifyId)}
                          onChange={() => toggle(track.trackSpotifyId)}
                          className="h-4 w-4 shrink-0 accent-fuchsia-500"
                        />
                        {track.imageUrl ? (
                          <img
                            src={track.imageUrl}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <FiMusic className="h-10 w-10 shrink-0 p-2 text-gray-500" />
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {track.title || "Música sem título"}
                          </span>
                          <span className="block truncate text-xs text-gray-400">
                            {track.artist}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </>
            )
          ) : !lists ? (
            <p role="status" className="text-sm text-gray-400">
              Carregando playlists...
            </p>
          ) : !lists.mine.length && !lists.partner.length ? (
            <p className="text-sm text-gray-400">
              Vocês ainda não possuem playlists no DuoTune.
            </p>
          ) : (
            <div className="space-y-6">
              {[
                ["Minhas playlists", lists.mine],
                ["Playlists do meu Duo", lists.partner],
              ].map(
                ([title, items]) =>
                  items.length > 0 && (
                    <section key={title}>
                      <h3 className="mb-3 text-sm font-medium text-gray-300">
                        {title}
                      </h3>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {items.map((list) => (
                          <button
                            key={list.id}
                            type="button"
                            onClick={() => choose(list)}
                            className="min-w-0 cursor-pointer rounded-xl border border-gray-700 bg-gray-800/60 p-3 text-left transition hover:border-fuchsia-500 hover:bg-gray-800"
                          >
                            {list.coverImageUrl ? (
                              <img
                                src={list.coverImageUrl}
                                alt=""
                                className="aspect-square w-full rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-950">
                                <FiMusic
                                  size={40}
                                  className="text-fuchsia-400"
                                />
                              </div>
                            )}
                            <span
                              className="mt-3 block truncate text-sm font-semibold"
                              title={list.name}
                            >
                              {list.name}
                            </span>
                            {list.isFusion && (
                              <span className="text-xs text-fuchsia-300">
                                Fusão do Duo
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </section>
                  ),
              )}
            </div>
          )}
        </div>
        {chosen && (
          <footer className="space-y-3 border-t border-gray-800 p-5">
            <p className="text-sm text-gray-300">
              {selected.size} selecionadas · {available} vagas na fila
            </p>
            {selected.size > available && (
              <p role="alert" className="text-sm text-amber-300">
                A seleção excede o limite de 99 músicas na fila. Desmarque
                algumas faixas para continuar. Nenhuma será adicionada
                parcialmente.
              </p>
            )}
            {submitted && playbackError && (
              <p role="alert" className="text-sm text-red-300">
                {playbackError}
              </p>
            )}
            {status !== "connected" && (
              <p role="status" className="text-sm text-amber-300">
                Conecte-se à sala para adicionar músicas.
              </p>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={
                !details ||
                !!error ||
                !selected.size ||
                selected.size > available ||
                playbackBusy ||
                status !== "connected"
              }
              className="w-full cursor-pointer rounded-lg bg-fuchsia-600 px-4 py-2.5 text-sm font-semibold hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {playbackBusy
                ? "Adicionando músicas..."
                : selected.size === details?.tracks.length
                  ? "Adicionar playlist completa"
                  : "Adicionar músicas selecionadas"}
            </button>
          </footer>
        )}
      </div>
    </dialog>
  );
}
