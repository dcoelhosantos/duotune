import { useState } from "react";
import { FiCalendar, FiMusic, FiX } from "react-icons/fi";
import { duoApi } from "../duo/api";

export default function DedicateTrackModal({ track, onClose }) {
  const [scheduledDate, setScheduledDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Define a data mínima como amanhã
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await duoApi("/dedications", {
        method: "POST",
        body: JSON.stringify({
          trackSpotifyId: track.id,
          title: track.title,
          artist: track.artist,
          imageUrl: track.imageUrl,
          scheduledDate: scheduledDate,
        }),
      });
      alert("Música programada com sucesso!");
      onClose();
    } catch (err) {
      setError(err.message || "Erro ao programar a música.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <FiX size={24} />
        </button>

        <h2 className="mb-6 text-xl font-bold text-white flex items-center gap-2">
          <FiCalendar className="text-fuchsia-500" /> Programar Surpresa
        </h2>

        <div className="mb-6 flex items-center gap-4 rounded-xl bg-gray-800/50 p-4">
          {track.imageUrl ? (
            <img
              src={track.imageUrl}
              alt={track.title}
              className="h-16 w-16 rounded object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-800">
              <FiMusic className="text-gray-500 text-2xl" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-bold text-white">{track.title}</p>
            <p className="truncate text-sm text-gray-400">{track.artist}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Data de entrega
            </label>
            <input
              type="date"
              required
              min={minDate}
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 p-3 text-white focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
            />
            <p className="mt-2 text-xs text-gray-500">
              A música será entregue no primeiro acesso da sua dupla neste dia.
            </p>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !scheduledDate}
            className="w-full rounded-lg bg-fuchsia-600 py-3 font-bold text-white hover:bg-fuchsia-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "Programando..." : "Programar Envio"}
          </button>
        </form>
      </div>
    </div>
  );
}
