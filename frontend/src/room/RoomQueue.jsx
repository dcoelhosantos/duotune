import { useEffect, useRef, useState } from "react";
import { FiList, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import { spotifyApi } from "../spotify/api";
import { useRoom } from "./RoomContext";

export default function RoomQueue() {
  const { snapshot, status, addTrack, removeTrack, playbackBusy } = useRoom();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const searchRef = useRef(null);
  const requestRef = useRef(null);
  const active = status === "connected";

  function dismissSearch() {
    requestRef.current?.abort();
    setResults([]);
    setError("");
    setSearching(false);
  }

  useEffect(() => {
    function outside(event) {
      if (!searchRef.current?.contains(event.target)) dismissSearch();
    }
    function escape(event) {
      if (event.key === "Escape") dismissSearch();
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      requestRef.current?.abort();
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  async function search(event) {
    event.preventDefault();
    if (!query.trim() || searching) return;
    const request = new AbortController();
    requestRef.current?.abort();
    requestRef.current = request;
    setSearching(true);
    setError("");
    try {
      const tracks = await spotifyApi(
        `search?q=${encodeURIComponent(query.trim())}`,
        { signal: request.signal },
      );
      if (!request.signal.aborted) setResults(tracks);
    } catch (err) {
      if (!request.signal.aborted) setError(err.message);
    } finally {
      if (requestRef.current === request) setSearching(false);
    }
  }
  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <FiList className="text-fuchsia-400" /> Fila compartilhada ·{" "}
        {snapshot?.queue?.length || 0}/30
      </h2>
      <ol className="max-h-64 space-y-3 overflow-y-auto">
        {snapshot?.queue?.map((entry, index) => (
          <li
            key={entry.id}
            className="flex items-center gap-3 rounded-xl border border-gray-800 p-3"
          >
            {entry.track.imageUrl && (
              <img
                src={entry.track.imageUrl}
                alt=""
                className="h-11 w-11 rounded-lg"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {entry.track.title}
              </p>
              <p className="truncate text-xs text-gray-400">
                {index === 0 ? "No player" : `${index + 1}ª na fila`} ·{" "}
                {entry.track.artist}
              </p>
            </div>
            <button
              type="button"
              disabled={!active || playbackBusy}
              onClick={() => removeTrack(entry.id)}
              aria-label={`Remover ${entry.track.title} da fila`}
              className="cursor-pointer rounded-lg p-2 text-red-400 hover:bg-red-500/10 disabled:opacity-40"
            >
              <FiTrash2 />
            </button>
          </li>
        ))}
      </ol>
      {!snapshot?.queue?.length && (
        <p className="mt-5 text-sm text-gray-400">
          A fila está vazia. Busque uma música e adicione para vocês.
        </p>
      )}
      <h3 className="mb-3 mt-6 border-t border-gray-800 pt-5 text-sm font-semibold">
        Adicionar músicas
      </h3>
      <div ref={searchRef}>
        <form onSubmit={search} className="flex gap-2">
          <input
            aria-label="Buscar músicas para a fila"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              dismissSearch();
            }}
            placeholder="Qual música vocês querem ouvir?"
            maxLength={200}
            className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm outline-none focus:border-fuchsia-500"
          />
          <button
            disabled={searching || !query.trim()}
            aria-label="Buscar músicas"
            className="cursor-pointer rounded-xl bg-fuchsia-600 p-3 disabled:opacity-40"
          >
            <FiSearch />
          </button>
        </form>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-300">
            {error}
          </p>
        )}
        {results.length > 0 && (
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto rounded-xl bg-gray-900 p-3">
            <p className="text-xs text-gray-400">Resultados da busca</p>
            {results.map((track) => (
              <div key={track.id} className="flex items-center gap-3">
                {track.imageUrl && (
                  <img
                    src={track.imageUrl}
                    alt=""
                    className="h-10 w-10 rounded"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{track.title}</p>
                  <p className="truncate text-xs text-gray-400">
                    {track.artist}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={
                    !active || playbackBusy || snapshot?.queue?.length >= 30
                  }
                  onClick={() => addTrack(track.id)}
                  aria-label={`Adicionar ${track.title} à fila`}
                  className="cursor-pointer rounded-lg p-2 text-fuchsia-300 hover:bg-gray-800 disabled:opacity-40"
                >
                  <FiPlus />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {!active && (
        <p className="mt-3 text-xs text-gray-500">
          Entre na sala para adicionar ou remover músicas.
        </p>
      )}
    </section>
  );
}
