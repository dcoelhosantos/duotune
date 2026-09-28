import { useState, useRef, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { playlistApi } from "../playlists/api";

export default function CreatePlaylistModal({ onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.length > 100) return;

    setLoading(true);
    setError("");

    try {
      await playlistApi("", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      if (isMounted.current) onSuccess();
    } catch (err) {
      if (isMounted.current) setError(err.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={!loading ? onClose : undefined}
    >
      <div
        className="bg-gray-950 border border-gray-800 rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Criar Playlist</h3>
          {/* Bloqueia o botão X se estiver em loading */}
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiX size={24} />
          </button>
        </div>

        {error && (
          <p className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Nome da playlist
            </label>
            <input
              autoFocus
              type="text"
              maxLength={100}
              required
              disabled={loading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Rock Clássico"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-fuchsia-500 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-xl font-semibold transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? "Criando..." : "Criar Playlist"}
          </button>
        </form>
      </div>
    </div>
  );
}
