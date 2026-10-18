import DuoEmptyState from "../components/DuoEmptyState";
import DuoPageHeading from "../components/DuoPageHeading";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiImage,
  FiMusic,
  FiPause,
  FiPlay,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { memoriesApi } from "../memories/api";
import { spotifyApi } from "../spotify/api";
import { useSpotify } from "../spotify/SpotifyContext";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function formatDate(value) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function MemoryAlbumHeading() {
  return (
    <DuoPageHeading
      eyebrow="Nossa história"
      title="Álbum de Memórias"
      description="Fotos e músicas que contam a história de vocês."
    />
  );
}

export default function MemoryAlbum() {
  const { playTrack, currentTrack, isPlaying, busy } = useSpotify();
  const [hasDuo, setHasDuo] = useState(
    () => Boolean(JSON.parse(localStorage.getItem("user") || "{}").duoId),
  );
  const [memories, setMemories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [image, setImage] = useState(null);
  const [trackQuery, setTrackQuery] = useState("");
  const [trackResults, setTrackResults] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [searching, setSearching] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const mutationInProgress = useRef(false);

  const markDuoInactive = useCallback(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...user, duoId: null }));
    window.dispatchEvent(new Event("profile-updated"));
    setHasDuo(false);
    setMemories([]);
    setCurrentIndex(0);
    setShowForm(false);
    setImage(null);
    setTrackQuery("");
    setTrackResults([]);
    setSelectedTrack(null);
    setMemoryToDelete(null);
    setError("");
  }, []);

  useEffect(() => {
    let active = true;
    memoriesApi()
      .then((data) => {
        if (active) setMemories(data || []);
      })
      .catch((err) => {
        if (!active) return;
        if (err.status === 409) markDuoInactive();
        else setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [markDuoInactive]);

  const currentMemory = memories[currentIndex];
  const isCurrentTrackPlaying =
    currentMemory &&
    currentTrack?.id === currentMemory.trackSpotifyId &&
    isPlaying;

  function resetForm() {
    setImage(null);
    setTrackQuery("");
    setTrackResults([]);
    setSelectedTrack(null);
    setShowForm(false);
    setError("");
  }

  async function searchTracks(event) {
    event.preventDefault();
    if (!trackQuery.trim() || searching) return;
    setSearching(true);
    setError("");
    try {
      setTrackResults(
        await spotifyApi(`search?q=${encodeURIComponent(trackQuery.trim())}`),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function saveMemory() {
    if (!image || !selectedTrack || mutationInProgress.current) return;
    mutationInProgress.current = true;
    setSaving(true);
    setError("");
    try {
      const form = new FormData();
      form.append("image", image);
      form.append("trackSpotifyId", selectedTrack.id);
      form.append("trackTitle", selectedTrack.title);
      form.append("trackArtist", selectedTrack.artist);
      if (selectedTrack.imageUrl)
        form.append("trackImageUrl", selectedTrack.imageUrl);

      const created = await memoriesApi("", { method: "POST", body: form });
      setMemories((items) => [...items, created]);
      setCurrentIndex(memories.length);
      resetForm();
    } catch (err) {
      if (err.status === 409) markDuoInactive();
      else setError(err.message);
    } finally {
      mutationInProgress.current = false;
      setSaving(false);
    }
  }

  async function removeMemory() {
    if (!memoryToDelete || mutationInProgress.current) return;
    mutationInProgress.current = true;
    setError("");
    const removedIndex = memories.findIndex(
      (item) => item.id === memoryToDelete.id,
    );
    setDeleting(true);
    try {
      await memoriesApi(`/${memoryToDelete.id}`, { method: "DELETE" });
      setMemories((items) =>
        items.filter((item) => item.id !== memoryToDelete.id),
      );
      setCurrentIndex((index) => {
        const nextIndex = removedIndex < index ? index - 1 : index;
        return Math.max(0, Math.min(nextIndex, memories.length - 2));
      });
      setMemoryToDelete(null);
    } catch (err) {
      if (err.status === 409) markDuoInactive();
      else setError(err.message);
    } finally {
      mutationInProgress.current = false;
      setDeleting(false);
    }
  }

  useEffect(() => {
    if (!memoryToDelete) return;
    function closeOnEscape(event) {
      if (event.key === "Escape" && !deleting) setMemoryToDelete(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [memoryToDelete, deleting]);

  function navigateTo(index) {
    const next = memories[index];
    if (!next || busy) return;
    setCurrentIndex(index);
    const alreadyPlaying =
      currentTrack?.id === next.trackSpotifyId && isPlaying;
    if (!alreadyPlaying) void playTrack({ id: next.trackSpotifyId });
  }

  function step(direction) {
    if (!memories.length) return;
    const nextIndex =
      (currentIndex + direction + memories.length) % memories.length;
    navigateTo(nextIndex);
  }

  if (loading) {
    return <p className="p-8 text-gray-400">Carregando álbum de memórias...</p>;
  }

  if (!hasDuo) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 pb-10">
        <MemoryAlbumHeading />
        <DuoEmptyState
          icon={<FiImage size={36} />}
          title="Um álbum para vocês dois"
          description="Forme seu Duo para guardar fotos e músicas dos momentos que vocês viveram juntos."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <MemoryAlbumHeading />
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            setError("");
          }}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-fuchsia-600 px-5 py-3 text-sm font-semibold transition-colors hover:bg-fuchsia-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400"
        >
          <FiPlus /> Adicionar memória
        </button>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      {showForm && (
        <div className="space-y-5 rounded-2xl border border-gray-800 bg-gray-950 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Nova memória</h2>
              <p className="mt-1 text-sm text-gray-400">
                Escolha uma foto e a música que combina com ela.
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              aria-label="Fechar"
              className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400"
            >
              <FiX />
            </button>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              Foto (JPG ou PNG, até 10 MB)
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                if (file && file.size > MAX_IMAGE_SIZE) {
                  setImage(null);
                  setError("A foto deve ter no máximo 10 MB.");
                  event.target.value = "";
                  return;
                }
                setImage(file);
                setError("");
              }}
              className="block w-full rounded-xl border border-gray-700 bg-gray-900 p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-gray-800 file:px-3 file:py-2 file:text-white"
            />
          </label>

          <div>
            <span className="mb-2 block text-sm font-medium">
              Música do Spotify
            </span>
            <form onSubmit={searchTracks} className="flex gap-2">
              <input
                value={trackQuery}
                onChange={(event) => setTrackQuery(event.target.value)}
                maxLength={200}
                placeholder="Buscar música ou artista"
                className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm outline-none focus:border-fuchsia-500"
              />
              <button
                type="submit"
                disabled={searching || !trackQuery.trim()}
                aria-label="Buscar música"
                className="cursor-pointer rounded-xl bg-gray-800 px-4 text-fuchsia-300 transition-colors hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiSearch />
              </button>
            </form>
            {trackResults.length > 0 && (
              <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                {trackResults.map((track) => (
                  <li key={track.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTrack(track);
                        setTrackResults([]);
                      }}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-2 text-left transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400 ${selectedTrack?.id === track.id ? "border-fuchsia-500 bg-fuchsia-500/10" : "border-gray-800 bg-gray-900 hover:border-gray-600"}`}
                    >
                      {track.imageUrl ? (
                        <img
                          src={track.imageUrl}
                          alt=""
                          className="h-11 w-11 rounded object-cover"
                        />
                      ) : (
                        <FiMusic className="mx-3" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {track.title}
                        </span>
                        <span className="block truncate text-xs text-gray-400">
                          {track.artist}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {selectedTrack && (
              <p className="mt-3 flex items-center gap-2 text-sm text-fuchsia-200">
                <FiMusic /> {selectedTrack.title} · {selectedTrack.artist}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void saveMemory()}
            disabled={!image || !selectedTrack || saving || deleting}
            className="cursor-pointer rounded-xl bg-fuchsia-600 px-5 py-3 text-sm font-semibold transition-colors hover:bg-fuchsia-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Salvando memória..." : "Salvar no álbum"}
          </button>
        </div>
      )}

      {memories.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-gray-700 bg-gray-950/60 px-6 py-16 text-center">
          <FiImage size={42} className="mx-auto mb-4 text-gray-500" />
          <h2 className="text-xl font-semibold">
            O álbum de vocês começa aqui
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
            Adicionem uma foto e uma música para guardar uma lembrança juntos.
          </p>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-6 cursor-pointer rounded-xl bg-fuchsia-600 px-5 py-3 text-sm font-semibold transition-colors hover:bg-fuchsia-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400"
            >
              Adicionar primeira memória
            </button>
          )}
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-gray-800 bg-gray-950">
          <div className="relative flex min-h-72 items-center justify-center bg-black sm:min-h-112">
            <img
              src={currentMemory.imageData}
              alt={`Memória ${currentIndex + 1} do casal`}
              className="max-h-[70vh] w-full object-contain"
            />
            {memories.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  disabled={busy}
                  aria-label="Foto anterior"
                  className="absolute left-3 cursor-pointer rounded-full border border-white/20 bg-black/60 p-3 text-white transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400 disabled:cursor-wait disabled:opacity-50 sm:left-5"
                >
                  <FiArrowLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  disabled={busy}
                  aria-label="Próxima foto"
                  className="absolute right-3 cursor-pointer rounded-full border border-white/20 bg-black/60 p-3 text-white transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400 disabled:cursor-wait disabled:opacity-50 sm:right-5"
                >
                  <FiArrowRight size={22} />
                </button>
              </>
            )}
            <div className="absolute bottom-4 rounded-full bg-black/70 px-3 py-1 text-sm text-white">
              {currentIndex + 1} / {memories.length}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 p-5 sm:p-6">
            {currentMemory.trackImageUrl ? (
              <img
                src={currentMemory.trackImageUrl}
                alt=""
                className="h-14 w-14 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-800">
                <FiMusic />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-fuchsia-300">
                Música desta memória
              </p>
              <p className="mt-1 truncate font-semibold">
                {currentMemory.trackTitle}
              </p>
              <p className="truncate text-sm text-gray-400">
                {currentMemory.trackArtist}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                void playTrack({ id: currentMemory.trackSpotifyId })
              }
              disabled={busy}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-fuchsia-600 px-4 py-3 text-sm font-semibold transition-colors hover:bg-fuchsia-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400 disabled:cursor-wait disabled:opacity-50"
            >
              {isCurrentTrackPlaying ? <FiPause /> : <FiPlay />}
              {isCurrentTrackPlaying ? "Pausar" : "Tocar música"}
            </button>
            <button
              type="button"
              onClick={() => setMemoryToDelete(currentMemory)}
              disabled={saving || deleting}
              aria-label="Remover memória"
              className="cursor-pointer rounded-full p-3 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiTrash2 />
            </button>
            <p className="w-full text-xs text-gray-500">
              Adicionada por {currentMemory.createdByName} ·{" "}
              {formatDate(currentMemory.createdAt)}
            </p>
          </div>

          {memories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-t border-gray-800 p-4">
              {memories.map((memory, index) => (
                <button
                  key={memory.id}
                  type="button"
                  onClick={() => navigateTo(index)}
                  disabled={busy}
                  aria-label={`Abrir memória ${index + 1}`}
                  aria-current={index === currentIndex ? "true" : undefined}
                  className={`h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400 disabled:cursor-wait disabled:opacity-50 ${index === currentIndex ? "border-fuchsia-400 opacity-100" : "border-transparent opacity-70 hover:scale-105 hover:opacity-100"}`}
                >
                  <img
                    src={memory.imageData}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {memoryToDelete && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setMemoryToDelete(null);
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-memory-title"
            aria-describedby="delete-memory-description"
            className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-950 p-6 shadow-2xl shadow-black/50"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-300">
                <FiTrash2 size={20} />
              </div>
              <div>
                <h2 id="delete-memory-title" className="text-lg font-semibold text-white">
                  Excluir memória?
                </h2>
                <p id="delete-memory-description" className="mt-2 text-sm leading-relaxed text-gray-400">
                  A foto e a música vinculada serão removidas do álbum do Duo. Essa ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setMemoryToDelete(null)}
                disabled={deleting}
                className="cursor-pointer rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void removeMemory()}
                disabled={deleting}
                className="cursor-pointer rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:cursor-wait disabled:opacity-60"
              >
                {deleting ? "Excluindo..." : "Excluir memória"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
