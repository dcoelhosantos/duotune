import { useEffect, useRef, useState } from "react";
import { FiPause, FiPlay } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q");
  const [searchResult, setSearchResult] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const loading = Boolean(query) && searchResult?.query !== query;
  const tracks = searchResult?.query === query ? searchResult.tracks : [];
  const errorMessage = searchResult?.query === query ? searchResult.error : "";

  // Cria o player de áudio quando o componente é montado
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = () => {
      console.error("Erro ao reproduzir o áudio.");
      setIsPlaying(false);
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    // Cleanup para quando o componente sair da tela
    return () => {
      audio.pause();
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  // Busca as músicas sempre que a query mudar
  useEffect(() => {
    if (!query) return;

    let cancelled = false;

    const fetchTracks = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          console.error("Token de acesso não encontrado.");
          if (!cancelled) {
            setSearchResult({
              query,
              tracks: [],
              error: "Sessão expirada. Faça login novamente.",
            });
          }
          return;
        }

        const response = await fetch(
          `http://localhost:8080/api/spotify/search?q=${encodeURIComponent(query)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          if (!cancelled) {
            setSearchResult({
              query,
              tracks: [],
              error: data.message || "Erro ao buscar músicas.",
            });
          }
          return;
        }

        if (!cancelled) {
          setSearchResult({
            query,
            tracks: data,
            error: "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Erro ao buscar músicas:", err);
          setSearchResult({
            query,
            tracks: [],
            error: "Não foi possível carregar as músicas no momento.",
          });
        }
      }
    };
    fetchTracks();

    // Se a query mudar antes da requisição terminar, marcamos essa requisição como cancelada
    return () => (cancelled = true);
  }, [query]);

  // Toca ou pausa a prévia da música
  const handlePlayPreview = async (track) => {
    const audio = audioRef.current;

    if (!audio || !track.previewUrl) {
      return;
    }

    // Se clicou na música que já está tocando,pausamos
    if (currentTrack?.id === track.id && isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      // Se é uma música diferente, trocamos a URL do áudio
      if (currentTrack?.id !== track.id) {
        audio.pause();
        audio.src = track.previewUrl;
        audio.load();
      }
      await audio.play();
      setCurrentTrack(track);
      setIsPlaying(true);
    } catch (error) {
      console.error("Erro ao reproduzir a prévia:", error);
      setIsPlaying(false);
    }
  };

  return (
    <div className="space-y-6 text-white">
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
              className="flex items-center justify-between p-3 bg-gray-900/60 hover:bg-gray-800 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-4">
                <img
                  src={track.imageUrl || "https://placehold.co/50x50"}
                  alt={track.title}
                  className="w-12 h-12 rounded object-cover"
                />

                <div>
                  <p className="font-semibold">{track.title}</p>
                  <p className="text-sm text-gray-400">{track.artist}</p>
                </div>
              </div>

              <button
                type="button"
                disabled={!track.previewUrl}
                onClick={() => handlePlayPreview(track)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  !track.previewUrl
                    ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                    : isCurrent
                      ? "bg-fuchsia-500 text-white"
                      : "bg-gray-700 group-hover:bg-fuchsia-500 text-white"
                }`}
                aria-label={
                  !track.previewUrl
                    ? "Prévia indisponível"
                    : isCurrent
                      ? `Pausar ${track.title}`
                      : `Reproduzir ${track.title}`
                }
              >
                {isCurrent ? (
                  <FiPause size={18} />
                ) : (
                  <FiPlay size={18} className="ml-0.5" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
