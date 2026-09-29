import { useEffect, useState } from "react";
import { FiMusic, FiPlus, FiUserPlus } from "react-icons/fi";
import { Link } from "react-router-dom";
import CreatePlaylistModal from "../components/CreatePlaylistModal";
import { playlistApi } from "../playlists/api";

const PlaylistCard = ({ pl }) => {
  const [failedCover, setFailedCover] = useState(null);
  return (
    <Link
      to={`/playlist/${pl.id}`}
      className="group block rounded-2xl border border-gray-800/70 bg-gray-950/60 p-3 transition hover:border-fuchsia-500/40 hover:bg-gray-800/60 focus-visible:outline-2 focus-visible:outline-fuchsia-400 sm:p-4"
    >
      <div className="w-full aspect-square bg-gray-800/50 rounded-md mb-4 shadow-lg overflow-hidden relative flex items-center justify-center">
        {pl.coverImageUrl && failedCover !== pl.coverImageUrl ? (
          <img
            src={pl.coverImageUrl}
            alt={`Capa de ${pl.name}`}
            loading="lazy"
            onError={() => setFailedCover(pl.coverImageUrl)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <FiMusic
            size={40}
            className="text-gray-600 group-hover:text-fuchsia-500 transition-colors"
          />
        )}
      </div>
      <h3 className="font-semibold truncate" title={pl.name}>
        {pl.name}
      </h3>
      <p className="text-sm text-gray-400 truncate mt-1">
        Criada em {new Date(pl.createdAt).toLocaleDateString("pt-BR")}
      </p>
    </Link>
  );
};

export default function Home() {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const hasDuo = !!storedUser.duoId;

  const [apiPlaylists, setApiPlaylists] = useState([]);
  const [duoPlaylists, setDuoPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchPlaylistsManually = async () => {
    setLoading(true);
    try {
      const data = await playlistApi("");
      setApiPlaylists(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    Promise.all([
      playlistApi(""),
      hasDuo ? playlistApi("/duo/list").catch(() => []) : Promise.resolve([]),
    ])
      .then(([myData, duoData]) => {
        if (active) {
          setApiPlaylists(myData);
          setDuoPlaylists(duoData);
        }
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
  }, [hasDuo]);

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-8">
      <section aria-labelledby="library-title">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-400">
              {storedUser.name?.trim()
                ? `Olá, ${storedUser.name.trim().split(/\s+/)[0]}!`
                : "Seu espaço musical"}
            </p>
            <h1
              id="library-title"
              className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              Biblioteca
            </h1>
            <p className="mt-3 text-sm text-gray-400">
              Suas músicas, suas descobertas, suas playlists.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-500"
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
              <PlaylistCard key={pl.id} pl={pl} />
            ))}
          </div>
        )}
      </section>

      <section
        aria-labelledby="duo-playlists-title"
        className="border-t border-gray-800 pt-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-400">
              Seu Duo
            </p>
            <h2
              id="duo-playlists-title"
              className="text-2xl font-semibold tracking-tight"
            >
              Playlists do Duo
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Explore o que a sua dupla está ouvindo.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400">Carregando espaço compartilhado...</p>
        ) : !hasDuo ? (
          <div className="text-gray-500 text-sm bg-gray-900/50 p-6 rounded-xl border border-gray-800 border-dashed">
            Você ainda não formou um Duo. Convide sua dupla para visualizar as
            playlists aqui!
            <Link
              to="/convidar"
              className="mt-4 inline-flex items-center gap-2 text-fuchsia-300 hover:text-fuchsia-200"
            >
              <FiUserPlus /> Convidar minha dupla
            </Link>
          </div>
        ) : duoPlaylists.length === 0 ? (
          <div className="text-gray-500 text-sm bg-gray-900/50 p-6 rounded-xl border border-gray-800 border-dashed">
            Seu Duo ainda não criou nenhuma playlist.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {duoPlaylists.map((pl) => (
              <PlaylistCard key={`duo-${pl.id}`} pl={pl} />
            ))}
          </div>
        )}
      </section>

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
