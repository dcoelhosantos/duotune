import DuoRequired from "../components/DuoRequired";
import DuoPageHeading from "../components/DuoPageHeading";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiMusic, FiShuffle } from "react-icons/fi";
import { playlistApi } from "../playlists/api";

export default function Fusion() {
  return (
    <DuoRequired
      heading={<FusionHeading />}
      icon={<FiShuffle size={36} />}
      title="Duas playlists, uma nova trilha sonora"
      description="Forme seu Duo para misturar as músicas de vocês e criar uma playlist com a identidade dos dois."
    >
      <FusionContent />
    </DuoRequired>
  );
}

function FusionHeading() {
  return (
    <DuoPageHeading
      eyebrow="Misturem suas músicas"
      title="Playlist Fusion"
      description="Escolham uma playlist de cada um e criem uma trilha sonora juntos."
    />
  );
}

function FusionContent() {
  const navigate = useNavigate();

  const bottomRef = useRef(null);

  const [myPlaylists, setMyPlaylists] = useState([]);
  const [duoPlaylists, setDuoPlaylists] = useState([]);
  const [selectedMyPlaylist, setSelectedMyPlaylist] = useState(null);
  const [selectedDuoPlaylist, setSelectedDuoPlaylist] = useState(null);
  const [pattern, setPattern] = useState(1);
  const [fusionName, setFusionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([
      playlistApi(""),
      playlistApi("/duo/list"),
    ])
      .then(([myData, duoData]) => {
        if (active) {
          setMyPlaylists(myData);
          setDuoPlaylists(duoData);
        }
      })
      .catch(() => {
        if (active) setError("Erro ao carregar as playlists. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSelectMyPlaylist = (pl) => {
    setSelectedMyPlaylist(pl);
    if (error) setError("");

    if (selectedDuoPlaylist) {
      const rawName = `Fusão: ${pl.name} & ${selectedDuoPlaylist.name}`;
      setFusionName(rawName.substring(0, 100));
      setTimeout(
        () =>
          bottomRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
          }),
        150,
      );
    }
  };

  const handleSelectDuoPlaylist = (pl) => {
    setSelectedDuoPlaylist(pl);
    if (error) setError("");

    if (selectedMyPlaylist) {
      const rawName = `Fusão: ${selectedMyPlaylist.name} & ${pl.name}`;
      setFusionName(rawName.substring(0, 100));
      setTimeout(
        () =>
          bottomRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
          }),
        150,
      );
    }
  };

  const handleCreateFusion = async (e) => {
    if (fusionName.trim().length > 100) {
      setError("O nome da playlist não pode exceder 100 caracteres.");
      return;
    }

    e.preventDefault();
    if (!selectedMyPlaylist || !selectedDuoPlaylist) {
      setError("Selecione uma playlist sua e uma do seu Duo para continuar.");
      return;
    }
    if (!fusionName.trim()) {
      setError("Dê um nome para a sua nova playlist.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const [myDetails, duoDetails] = await Promise.all([
        playlistApi(`/${selectedMyPlaylist.id}`),
        playlistApi(`/${selectedDuoPlaylist.id}`),
      ]);

      if (!myDetails.tracks?.length || !duoDetails.tracks?.length) {
        throw new Error(
          "Ambas as playlists precisam ter músicas para realizar a fusão.",
        );
      }

      const formatTracks = (tracks) =>
        tracks.map((t) => ({
          trackSpotifyId: t.trackSpotifyId,
          title: t.title?.trim() || `Faixa ${t.trackSpotifyId}`,
          artist: t.artist?.trim() || "Artista desconhecido",
          imageUrl: t.imageUrl,
        }));

      const payload = {
        name: fusionName.trim(),
        pattern: parseInt(pattern),
        tracksUser1: formatTracks(myDetails.tracks),
        tracksUser2: formatTracks(duoDetails.tracks),
      };

      const newFusion = await playlistApi("/fusion", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      navigate(`/playlist/${newFusion.id}`);
    } catch (err) {
      setError(err.message || "Erro ao criar a fusão mágica.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-gray-400">Carregando painel de fusão...</div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10 text-white">
      <FusionHeading />

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-8">
          {error}
        </div>
      )}

      <form onSubmit={handleCreateFusion} className="space-y-12">
        {/* Painel de Seleção das Playlists */}
        <div className="flex flex-col md:flex-row items-stretch gap-6">
          <div className="flex-1 bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-fuchsia-500/30 transition-colors flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              Sua Playlist
            </h3>
            <div className="space-y-3 flex-1 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
              {myPlaylists.length === 0 ? (
                <p className="text-sm text-gray-500 text-center mt-10">
                  Você ainda não tem playlists.
                </p>
              ) : (
                myPlaylists.map((pl) => (
                  <button
                    key={`my-${pl.id}`}
                    type="button"
                    onClick={() => handleSelectMyPlaylist(pl)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-left ${selectedMyPlaylist?.id === pl.id ? "bg-fuchsia-600/20 border-fuchsia-500 text-white border" : "bg-gray-800 border-transparent text-gray-400 hover:bg-gray-700 border"}`}
                  >
                    <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center shrink-0">
                      <FiMusic size={16} />
                    </div>
                    <span className="truncate text-sm font-medium">
                      {pl.name}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center">
            <div className="w-12 h-12 bg-fuchsia-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(192,38,211,0.4)] z-10">
              <FiPlus size={24} className="text-white" />
            </div>
          </div>

          <div className="flex-1 bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-colors flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              Playlist do Duo
            </h3>
            <div className="space-y-3 flex-1 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
              {duoPlaylists.length === 0 ? (
                <p className="text-sm text-gray-500 text-center mt-10">
                  Seu Duo ainda não tem playlists.
                </p>
              ) : (
                duoPlaylists.map((pl) => (
                  <button
                    key={`duo-${pl.id}`}
                    type="button"
                    onClick={() => handleSelectDuoPlaylist(pl)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-left ${selectedDuoPlaylist?.id === pl.id ? "bg-blue-600/20 border-blue-500 text-white border" : "bg-gray-800 border-transparent text-gray-400 hover:bg-gray-700 border"}`}
                  >
                    <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center shrink-0">
                      <FiMusic size={16} />
                    </div>
                    <span className="truncate text-sm font-medium">
                      {pl.name}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Regras de Mesclagem */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">
            Regra de mesclagem
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { value: 1, title: "1x1", desc: "Uma por vez" },
              { value: 2, title: "2x2", desc: "Duas por vez" },
              { value: 3, title: "3x3", desc: "Três por vez" },
              { value: 4, title: "4x4", desc: "Quatro por vez" },
              { value: 5, title: "Blocos", desc: "Cinco por vez" },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex flex-col items-start gap-2 p-4 rounded-2xl border cursor-pointer transition-all ${
                  pattern === opt.value
                    ? "bg-fuchsia-900/30 border-fuchsia-500 shadow-lg shadow-fuchsia-900/20"
                    : "bg-gray-900/50 border-gray-800 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="pattern"
                    value={opt.value}
                    checked={pattern === opt.value}
                    onChange={() => setPattern(opt.value)}
                    className="accent-fuchsia-500"
                  />
                  <p
                    className={`font-semibold ${pattern === opt.value ? "text-fuchsia-400" : "text-gray-300"}`}
                  >
                    {opt.title}
                  </p>
                </div>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <label className="block text-white font-semibold mb-2">
            Nome da Nova Playlist
          </label>
          <input
            type="text"
            required
            maxLength={100}
            value={fusionName}
            onChange={(e) => {
              setFusionName(e.target.value);
              if (error) setError("");
            }}
            placeholder="Ex: Nossa Trilha Perfeita"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-fuchsia-500 transition-colors"
          />
        </div>

        {/* Botão de Submit e Ref Invisível */}
        <div className="pt-4" ref={bottomRef}>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !selectedMyPlaylist ||
              !selectedDuoPlaylist ||
              !fusionName.trim()
            }
            className="w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(192,38,211,0.2)] hover:shadow-[0_0_25px_rgba(192,38,211,0.4)] cursor-pointer"
          >
            {isSubmitting ? "Gerando Fusão Mágica..." : "Criar Playlist Fusion"}
          </button>
        </div>
      </form>
    </div>
  );
}
