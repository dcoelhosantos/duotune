import { useEffect, useState } from "react";
import { FiPlay, FiUserPlus, FiPlus, FiMusic } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { playlistApi } from "../playlists/api";
import CreatePlaylistModal from "../components/CreatePlaylistModal";

export default function Home() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const hasDuo = !!storedUser.duoId;

  const [apiPlaylists, setApiPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const playlists = [
    {
      id: 1,
      name: "Nossa História",
      color: "bg-gradient-to-br from-fuchsia-600 to-purple-900",
    },
    {
      id: 2,
      name: "Indie Vibes",
      color: "bg-gradient-to-br from-blue-600 to-indigo-900",
    },
    {
      id: 3,
      name: "Para Relaxar",
      color: "bg-gradient-to-br from-emerald-600 to-teal-900",
    },
    {
      id: 4,
      name: "Rock Clássico",
      color: "bg-gradient-to-br from-orange-600 to-red-900",
    },
  ];

  const fetchPlaylistsManually = async () => {
    setLoading(true);
    try {
      const data = await playlistApi();
      setApiPlaylists(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    playlistApi()
      .then((data) => {
        if (active) setApiPlaylists(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-8 relative">
      {!hasDuo && (
        <div className="bg-gradient-to-r from-fuchsia-700 to-purple-900 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between shadow-lg border border-fuchsia-500/30">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Encontre sua dupla! 🎵
            </h2>
            <p className="text-purple-200">
              Você ainda não formou o seu Duo. Convide alguém especial para
              compartilhar e mesclar sua trilha sonora.
            </p>
          </div>
          <Link
            to="/convidar"
            className="mt-6 md:mt-0 bg-white text-fuchsia-700 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-md hover:scale-105"
          >
            <FiUserPlus size={20} /> Convidar agora
          </Link>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold mb-6">Olá!</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="flex items-center gap-4 bg-gray-800/50 hover:bg-gray-800 transition-colors rounded-md overflow-hidden cursor-pointer group"
            >
              <div
                className={`w-20 h-20 ${playlist.color} shrink-0 shadow-lg`}
              />
              <div className="font-semibold">{playlist.name}</div>
              <button className="ml-auto mr-4 w-12 h-12 bg-fuchsia-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xl hover:scale-105 cursor-pointer">
                <FiPlay size={24} className="text-white fill-white ml-1" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold hover:underline cursor-pointer">
            Sua Biblioteca Pessoal
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 text-sm font-semibold text-fuchsia-400 hover:text-fuchsia-300 transition-colors bg-fuchsia-500/10 px-4 py-2 rounded-full border border-fuchsia-500/30 cursor-pointer"
          >
            <FiPlus size={18} /> Criar Playlist
          </button>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        {loading ? (
          <p className="text-gray-400">Carregando suas playlists...</p>
        ) : apiPlaylists.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Você ainda não tem nenhuma playlist. Clique no botão acima para
            criar a primeira!
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {apiPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => navigate(`/playlist/${pl.id}`)}
                className="bg-gray-950 p-4 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer group select-none border border-transparent hover:border-gray-800"
              >
                <div className="w-full aspect-square bg-gray-800/50 rounded-md mb-4 shadow-lg overflow-hidden relative flex items-center justify-center">
                  <FiMusic
                    size={40}
                    className="text-gray-600 group-hover:text-fuchsia-500 transition-colors"
                  />
                  <button className="absolute bottom-2 right-2 w-10 h-10 bg-fuchsia-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-105 shadow-md cursor-pointer">
                    <FiPlay size={20} className="text-white fill-white ml-1" />
                  </button>
                </div>
                <h3 className="font-semibold truncate" title={pl.name}>
                  {pl.name}
                </h3>
                <p className="text-sm text-gray-400 truncate mt-1">
                  Criada em {new Date(pl.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreatePlaylistModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchPlaylistsManually();
          }}
        />
      )}
    </div>
  );
}
