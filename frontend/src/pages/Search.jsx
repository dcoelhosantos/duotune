import { useSpotify } from "../spotify/SpotifyContext";
import { useEffect, useState } from "react";
import { FiPause, FiPlay, FiPlus, FiSearch } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import AddToPlaylistModal from "../components/AddToPlaylistModal";

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q");
  const [searchResult, setSearchResult] = useState(null);
  const [trackToAdd, setTrackToAdd] = useState(null);
  const { currentTrack, isPlaying, deviceId, busy, playTrack } = useSpotify();

  const loading = Boolean(query) && searchResult?.query !== query;
  const tracks = searchResult?.query === query ? searchResult.tracks : [];
  const errorMessage = searchResult?.query === query ? searchResult.error : "";

  useEffect(() => {
    if (!query) return;
    let cancelled = false;

    const fetchTracks = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          if (!cancelled)
            setSearchResult({
              query,
              tracks: [],
              error: "Sessão expirada. Faça login novamente.",
            });
          return;
        }

        const response = await fetch(
          `/api/spotify/search?q=${encodeURIComponent(query)}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await response.json();
        if (!response.ok) {
          if (!cancelled)
            setSearchResult({
              query,
              tracks: [],
              error: data.message || "Erro ao buscar músicas.",
            });
          return;
        }

        if (!cancelled) setSearchResult({ query, tracks: data, error: "" });
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        if (!cancelled)
          setSearchResult({
            query,
            tracks: [],
            error: "Não foi possível carregar as músicas.",
          });
      }
    };

    fetchTracks();
    return () => (cancelled = true);
  }, [query]);

  return (
    <div className="space-y-6 text-white relative pb-10">
      
      {/* Exibe uma mensagem amigável caso não haja nenhuma pesquisa ativa */}
      {!query ? (
        <div className="flex flex-col items-center justify-center text-gray-400 py-24 space-y-4">
          <FiSearch size={48} className="text-gray-600" />
          <p className="text-lg">Comece a digitar para encontrar músicas e artistas.</p>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold">
            Resultados para: <span className="text-fuchsia-500">"{query}"</span>
          </h1>

          {loading && <p className="text-gray-400">Buscando músicas...</p>}
          {errorMessage && <p className="text-red-400">{errorMessage}</p>}
          {!loading && !errorMessage && tracks.length === 0 && (
            <p className="text-gray-400">Nenhuma faixa encontrada.</p>
          )}

          <div className="space-y-2">
            {tracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id && isPlaying;

              return (
                <div
                  key={track.id}
                  className="w-full flex items-center justify-between p-3 bg-gray-900/60 hover:bg-gray-800 rounded-lg transition-colors group"
                >
                  <button
                    type="button"
                    disabled={!deviceId || busy}
                    onClick={() => playTrack(track)}
                    aria-label={
                      isCurrent
                        ? `Pausar ${track.title}`
                        : `Reproduzir ${track.title}`
                    }
                    className="flex-1 flex items-center gap-4 text-left min-w-0 pr-4 outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 rounded disabled:cursor-not-allowed cursor-pointer"
                  >
                    <img
                      src={track.imageUrl || "https://placehold.co/50x50"}
                      alt={track.title}
                      className="w-12 h-12 rounded object-cover shrink-0"
                    />
                    <span className="truncate">
                      <span className="block font-semibold truncate">
                        {track.title}
                      </span>
                      <span className="block text-sm text-gray-400 truncate">
                        {track.artist}
                      </span>
                    </span>
                  </button>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      title="Adicionar à playlist"
                      onClick={() => setTrackToAdd(track)}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-fuchsia-500 cursor-pointer"
                    >
                      <FiPlus size={20} />
                    </button>

                    <button
                      type="button"
                      disabled={!deviceId || busy}
                      onClick={() => playTrack(track)}
                      title={isCurrent ? "Pausar" : "Reproduzir"}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        !deviceId || busy
                          ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                          : isCurrent
                            ? "bg-fuchsia-500 text-white cursor-pointer"
                            : "bg-gray-700 hover:bg-fuchsia-500 text-white cursor-pointer"
                      }`}
                    >
                      {isCurrent ? (
                        <FiPause size={18} />
                      ) : (
                        <FiPlay size={18} className="ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal de Adicionar à Playlist */}
      {trackToAdd && (
        <AddToPlaylistModal
          track={trackToAdd}
          onClose={() => setTrackToAdd(null)}
        />
      )}
    </div>
  );
}
