import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiTrash2,
  FiClock,
  FiPlay,
  FiMoreVertical,
  FiPlus,
  FiList,
  FiShare2,
  FiEdit2,
  FiMusic,
} from "react-icons/fi";
import { playlistApi } from "../playlists/api";
import AddToPlaylistModal from "../components/AddToPlaylistModal";
import EditPlaylistModal from "../components/EditPlaylistModal"; // Importe o modal de edição

export default function PlaylistDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [playlistMenuOpen, setPlaylistMenuOpen] = useState(false);
  const [trackMenuOpenId, setTrackMenuOpenId] = useState(null);
  const [trackForModal, setTrackForModal] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // Controle do modal de edição

  useEffect(() => {
    let active = true;
    playlistApi(`/${id}`)
      .then((data) => {
        if (active) setPlaylist(data);
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
          if (err.status === 403 || err.status === 404) navigate("/");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, navigate]);

  const handleRemoveTrack = async (trackSpotifyId) => {
    setTrackMenuOpenId(null);
    if (!window.confirm("Tem certeza que deseja remover esta música?")) return;

    try {
      await playlistApi(`/${id}/tracks/${trackSpotifyId}`, {
        method: "DELETE",
      });
      setPlaylist((prev) => ({
        ...prev,
        tracks: prev.tracks.filter((t) => t.trackSpotifyId !== trackSpotifyId),
      }));
    } catch (err) {
      alert("Erro ao remover a música: " + err.message);
    }
  };

  const handleDeletePlaylist = async () => {
    setPlaylistMenuOpen(false);
    if (
      !window.confirm(
        `Tem certeza que deseja APAGAR a playlist "${playlist.name}"? Esta ação não pode ser desfeita.`,
      )
    )
      return;

    try {
      await playlistApi(`/${id}`, { method: "DELETE" });
      navigate("/");
    } catch (err) {
      alert("Erro ao excluir playlist: " + err.message);
    }
  };

  const closeMenus = () => {
    setPlaylistMenuOpen(false);
    setTrackMenuOpenId(null);
  };

  if (loading)
    return <div className="text-gray-400 p-8">Carregando playlist...</div>;
  if (error) return <div className="text-red-400 p-8">{error}</div>;
  if (!playlist) return null;

  const coverImage =
    playlist.tracks.length > 0 ? playlist.tracks[0].imageUrl : null;

  return (
    <div className="relative pb-10">
      {(playlistMenuOpen || trackMenuOpenId) && (
        <div className="fixed inset-0 z-40" onClick={closeMenus}></div>
      )}

      <div className="w-full bg-gradient-to-b from-fuchsia-900/40 to-gray-950 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-8 flex flex-col md:flex-row items-center md:items-end gap-8 relative">
          <div className="w-64 h-64 bg-gray-800 shadow-2xl rounded-md flex items-center justify-center shrink-0 overflow-hidden relative group">
            {coverImage ? (
              <img
                src={coverImage}
                alt="Capa da Playlist"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <FiMusic className="text-gray-600 text-6xl" />
            )}
          </div>

          <div className="flex flex-col gap-3 w-full">
            <p className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Playlist Pública
            </p>
            <h1
              className="text-5xl md:text-6xl font-bold text-white truncate pb-2 leading-[1.15]"
              title={playlist.name}
            >
              {playlist.name}
            </h1>

            {playlist.description && (
              <p
                className="text-gray-300 text-sm mt-1 max-w-2xl line-clamp-2"
                title={playlist.description}
              >
                {playlist.description}
              </p>
            )}

            <p className="text-gray-400 text-sm mt-2">
              Criada em{" "}
              {new Date(playlist.createdAt).toLocaleDateString("pt-BR")} •{" "}
              {playlist.tracks.length} músicas
            </p>

            <div className="flex items-center gap-4 mt-4">
              <button
                disabled={playlist.tracks.length === 0}
                className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-xl cursor-pointer"
              >
                <FiPlay size={24} className="fill-black ml-1" />
              </button>

              <button
                onClick={() => setIsEditing(true)}
                className="w-10 h-10 rounded-full border border-gray-500 text-white flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <FiEdit2 size={18} />
              </button>

              <div className="relative z-50">
                <button
                  onClick={() => setPlaylistMenuOpen(!playlistMenuOpen)}
                  className="w-10 h-10 rounded-full text-white flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <FiMoreVertical size={24} />
                </button>

                {playlistMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-2 text-sm text-gray-300">
                    <Link
                      to="/search"
                      state={{ autoFocus: true }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left cursor-pointer"
                    >
                      <FiPlus size={18} /> Adicionar músicas
                    </Link>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left cursor-pointer">
                      <FiList size={18} /> Adicionar à fila
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left cursor-pointer">
                      <FiShare2 size={18} /> Compartilhar
                    </button>
                    <div className="h-px bg-gray-700 my-1"></div>
                    <button
                      onClick={handleDeletePlaylist}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left text-red-400 cursor-pointer"
                    >
                      <FiTrash2 size={18} /> Excluir playlist
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LISTAGEM DE MÚSICAS */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-[16px_minmax(0,1fr)_120px_40px] gap-4 px-4 py-2 text-sm text-gray-400 border-b border-gray-800 mb-4">
          <div className="text-center">#</div>
          <div>Título</div>
          <div className="flex items-center gap-1">
            <FiClock /> Adicionada
          </div>
          <div></div>
        </div>

        {playlist.tracks.length === 0 ? (
          <div className="text-center text-gray-400 py-20 space-y-6">
            <p className="text-lg">Esta playlist ainda não tem músicas.</p>
            <Link
              to="/search"
              state={{ autoFocus: true }}
              className="inline-block text-fuchsia-400 hover:text-fuchsia-300 font-semibold"
            >
              Buscar músicas
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {playlist.tracks.map((track, index) => (
              <div
                key={track.trackSpotifyId}
                className="grid grid-cols-[16px_minmax(0,1fr)_120px_40px] gap-4 items-center px-4 py-3 hover:bg-gray-800/60 rounded-lg group transition-colors relative"
              >
                <div className="text-gray-500 text-right group-hover:hidden">
                  {index + 1}
                </div>
                <div className="hidden group-hover:block text-white cursor-pointer">
                  <FiPlay />
                </div>

                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-gray-800 rounded shrink-0 overflow-hidden flex items-center justify-center">
                    {track.imageUrl ? (
                      <img
                        src={track.imageUrl}
                        alt={track.title || "Capa"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FiMusic className="text-gray-500 text-lg" />
                    )}
                  </div>

                  <div className="truncate">
                    <p
                      className="font-semibold text-white truncate"
                      title={track.title}
                    >
                      {track.title || `Faixa ID: ${track.trackSpotifyId}`}
                    </p>
                    <p
                      className="text-xs text-gray-400 truncate"
                      title={track.artist}
                    >
                      {track.artist || "Artista Desconhecido"}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-gray-400 truncate">
                  {new Date(track.addedAt).toLocaleDateString("pt-BR")}
                </div>

                <div className="flex justify-end relative z-50">
                  <button
                    onClick={() =>
                      setTrackMenuOpenId(
                        trackMenuOpenId === track.trackSpotifyId
                          ? null
                          : track.trackSpotifyId,
                      )
                    }
                    className="p-2 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <FiMoreVertical size={20} />
                  </button>

                  {trackMenuOpenId === track.trackSpotifyId && (
                    <div className="absolute right-8 top-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-2 text-sm text-gray-300">
                      <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left cursor-pointer">
                        <FiList size={18} /> Tocar a seguir
                      </button>

                      <button
                        onClick={() => {
                          setTrackForModal({
                            id: track.trackSpotifyId,
                            title: track.title,
                            artist: track.artist,
                            imageUrl: track.imageUrl,
                          });
                          setTrackMenuOpenId(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left cursor-pointer"
                      >
                        <FiPlus size={18} /> Salvar na playlist
                      </button>

                      <div className="h-px bg-gray-700 my-1"></div>

                      <button
                        onClick={() => handleRemoveTrack(track.trackSpotifyId)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left text-red-400 cursor-pointer"
                      >
                        <FiTrash2 size={18} /> Remover da playlist
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {trackForModal && (
        <AddToPlaylistModal
          track={trackForModal}
          onClose={() => setTrackForModal(null)}
        />
      )}

      {isEditing && (
        <EditPlaylistModal
          playlist={playlist}
          onClose={() => setIsEditing(false)}
          onSuccess={(updatedData) => {
            setPlaylist((prev) => ({ ...prev, ...updatedData }));
            setIsEditing(false);
          }}
        />
      )}
    </div>
  );
}
