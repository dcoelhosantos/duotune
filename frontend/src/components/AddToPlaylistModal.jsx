import { useEffect, useState, useRef } from "react";
import { FiX, FiCheck, FiPlus } from "react-icons/fi";
import { playlistApi } from "../playlists/api";
import CreatePlaylistModal from "./CreatePlaylistModal";

export default function AddToPlaylistModal({ track, onClose }) {
  const [playlists, setPlaylists] = useState([]);
  const [playlistsWithTrack, setPlaylistsWithTrack] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", msg: "" });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isMounted = useRef(true);

  const fetchPlaylistsData = () => {
    Promise.all([playlistApi(), playlistApi(`/containing-track/${track.id}`)])
      .then(([playlistsData, containingData]) => {
        if (isMounted.current) {
          setPlaylists(playlistsData || []);
          setPlaylistsWithTrack(containingData || []);
        }
      })
      .catch(() => {
        if (isMounted.current)
          setFeedback({ type: "error", msg: "Erro ao carregar informações." });
      })
      .finally(() => {
        if (isMounted.current) setLoading(false);
      });
  };

  useEffect(() => {
    isMounted.current = true;
    fetchPlaylistsData();
    return () => {
      isMounted.current = false;
    };
  }, [track.id]);

  const handleAddToPlaylist = async (playlistId) => {
    setFeedback({ type: "loading", msg: "Adicionando..." });
    try {
      await playlistApi(`/${playlistId}/tracks`, {
        method: "POST",
        body: JSON.stringify({
          trackSpotifyId: track.id,
          title: track.title,
          artist: track.artist,
          imageUrl: track.imageUrl || null,
        }),
      });
      if (!isMounted.current) return;

      setPlaylistsWithTrack((prev) => [...prev, playlistId]);
      setFeedback({ type: "success", msg: "Música adicionada com sucesso!" });

      setTimeout(() => {
        if (isMounted.current) onClose();
      }, 1500);
    } catch (err) {
      if (!isMounted.current) return;
      setFeedback({ type: "error", msg: err.message });
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-gray-950 border border-gray-800 rounded-2xl p-6 w-full max-w-md flex flex-col max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Adicionar à Playlist</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white cursor-pointer"
            >
              <FiX size={24} />
            </button>
          </div>

          <p className="text-sm text-gray-400 mb-6 truncate">
            Faixa: <span className="text-white font-medium">{track.title}</span>
          </p>

          {feedback.msg && (
            <div
              className={`p-3 rounded-lg text-sm mb-4 flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-green-500/10 text-green-400"
                  : feedback.type === "error"
                    ? "bg-red-500/10 text-red-400"
                    : "text-gray-300"
              }`}
            >
              {feedback.type === "success" && <FiCheck size={18} />}
              {feedback.msg}
            </div>
          )}

          <div className="overflow-y-auto space-y-2 flex-1 pr-2">
            {/* Botão de atalho para criar nova playlist */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-700 hover:border-fuchsia-500 hover:bg-fuchsia-500/10 transition-colors cursor-pointer mb-2"
            >
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-fuchsia-400">
                <FiPlus />
              </div>
              <span className="font-semibold text-fuchsia-400">
                Criar nova playlist
              </span>
            </button>

            {loading ? (
              <p className="text-gray-500 text-sm mt-4 text-center">
                Carregando...
              </p>
            ) : playlists.length === 0 ? (
              <p className="text-gray-500 text-sm mt-4 text-center">
                Nenhuma playlist encontrada.
              </p>
            ) : (
              playlists.map((pl) => {
                const isAlreadyAdded = playlistsWithTrack.includes(pl.id);
                return (
                  <button
                    key={pl.id}
                    onClick={() => handleAddToPlaylist(pl.id)}
                    disabled={
                      isAlreadyAdded ||
                      feedback.type === "loading" ||
                      feedback.type === "success"
                    }
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                      isAlreadyAdded
                        ? "bg-gray-900/30 border-gray-800 opacity-60 cursor-not-allowed"
                        : "bg-gray-900/50 hover:bg-gray-800 border-transparent hover:border-gray-700 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p
                        className={`font-semibold truncate ${isAlreadyAdded ? "text-gray-500" : "text-white"}`}
                      >
                        {pl.name}
                      </p>
                      {isAlreadyAdded && (
                        <span className="text-xs text-red-400 font-medium bg-red-500/10 px-2 py-1 rounded-md">
                          Já adicionada
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreatePlaylistModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            setLoading(true);
            fetchPlaylistsData();
          }}
        />
      )}
    </>
  );
}
