import { useEffect, useState } from "react";
import {
  FiMusic,
  FiPlus,
  FiUserPlus,
  FiPlay,
  FiGift,
  FiX,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import CreatePlaylistModal from "../components/CreatePlaylistModal";
import { playlistApi } from "../playlists/api";
import { duoApi } from "../duo/api";
import { useSpotify } from "../spotify/SpotifyContext";

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
  const hasDuo =
    storedUser.duoId !== null &&
    storedUser.duoId !== undefined &&
    storedUser.duoId !== "null";

  const [apiPlaylists, setApiPlaylists] = useState([]);
  const [duoPlaylists, setDuoPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { playTrack, busy } = useSpotify();
  const [surpriseTrack, setSurpriseTrack] = useState(null);
  const [showSurpriseModal, setShowSurpriseModal] = useState(false);

  useEffect(() => {
    if (hasDuo) {
      duoApi("/dedications/pending")
        .then((data) => {
          if (data) {
            setSurpriseTrack(data);
            setShowSurpriseModal(true);
          }
        })
        .catch(() => {
        });
    }
  }, [hasDuo]);

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

      {showSurpriseModal && surpriseTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md transition-opacity">
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-fuchsia-500/30 bg-gray-900 shadow-[0_0_50px_rgba(217,70,239,0.15)] text-center">
            <button
              onClick={() => setShowSurpriseModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white z-10"
            >
              <FiX size={24} />
            </button>

            <div className="bg-gradient-to-b from-fuchsia-900/40 to-transparent p-8 pt-10">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-fuchsia-500/20 text-fuchsia-400">
                <FiGift size={32} />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-white">
                Surpresa do seu Duo!
              </h2>
              <p className="text-sm text-gray-300">
                Sua dupla programou uma música especial para o seu dia de hoje.
              </p>
            </div>

            <div className="px-8 pb-8">
              <div className="mb-6 flex flex-col items-center gap-3">
                <div className="h-32 w-32 overflow-hidden rounded-lg shadow-lg">
                  {surpriseTrack.imageUrl ? (
                    <img
                      src={surpriseTrack.imageUrl}
                      alt="Capa"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-800">
                      <FiMusic className="text-gray-500 text-4xl" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-lg font-bold text-white truncate w-56">
                    {surpriseTrack.title}
                  </p>
                  <p className="text-sm text-gray-400 truncate w-56">
                    {surpriseTrack.artist}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  playTrack(surpriseTrack);
                  setShowSurpriseModal(false);
                }}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-fuchsia-600 py-3 font-bold text-white hover:bg-fuchsia-500 transition-colors disabled:opacity-50"
              >
                <FiPlay size={18} className="fill-current" /> Ouvir Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
