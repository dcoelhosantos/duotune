import { useState } from "react";
import { FiX } from "react-icons/fi";
import { playlistApi } from "../playlists/api";

export default function EditPlaylistModal({ playlist, onClose, onSuccess }) {
  const [name, setName] = useState(playlist.name || "");
  const [description, setDescription] = useState(playlist.description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(""); 

    try {
      await playlistApi(`/${playlist.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json", 
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      onSuccess({ name: name.trim(), description: description.trim() });
    } catch (err) {
      setError(err.message || "Ocorreu um erro ao tentar salvar.");
    } finally {
      setLoading(false);
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
          <h3 className="text-xl font-bold">Editar Detalhes</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white disabled:opacity-50 cursor-pointer"
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
            <label className="block text-sm text-gray-300 mb-2">Nome</label>
            <input
              type="text"
              maxLength={100}
              required
              disabled={loading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-fuchsia-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Descrição (Opcional)
            </label>
            <textarea
              maxLength={500}
              disabled={loading}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione uma descrição opcional"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-fuchsia-500 min-h-[100px] resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-xl font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </form>
      </div>
    </div>
  );
}
