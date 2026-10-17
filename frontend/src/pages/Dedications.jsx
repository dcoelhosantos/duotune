import { useEffect, useState } from "react";
import {
  FiGift,
  FiSend,
  FiTrash2,
  FiPlay,
  FiMusic,
  FiAlertCircle,
  FiSearch,
} from "react-icons/fi";
import { duoApi } from "../duo/api";
import { useSpotify } from "../spotify/SpotifyContext";
import { useNavigate, Link } from "react-router-dom";

export default function Dedications() {
  const [activeTab, setActiveTab] = useState("received");
  const [dedications, setDedications] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { playTrack, connected } = useSpotify();
  const isConnected = connected;

  const connectSpotify = () => {
    navigate("/perfil");
  };

  useEffect(() => {
    let active = true;

    const endpoint =
      activeTab === "received" ? "/dedications/received" : "/dedications/sent";

    duoApi(endpoint)
      .then((data) => {
        if (active) setDedications(data || []);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeTab]);

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja cancelar esta surpresa?"))
      return;
    try {
      await duoApi(`/dedications/${id}`, { method: "DELETE" });
      setDedications(dedications.filter((d) => d.id !== id));
    } catch (err) {
      alert(err.message || "Erro ao excluir dedicatória.");
    }
  };

  const handlePlay = async (dedication) => {
    if (!isConnected) {
      connectSpotify();
      return;
    }

    playTrack({ id: dedication.trackSpotifyId }, null, true);

    try {
      await duoApi(`/dedications/${dedication.id}/deliver`, { method: "POST" });
    } catch (e) {
      console.error("Falha ao confirmar entrega", e);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "Data indefinida";

    if (typeof dateValue === "string") {
      const [year, month, day] = dateValue.split("-");
      return `${day}/${month}/${year}`;
    }

    if (Array.isArray(dateValue)) {
      const [year, month, day] = dateValue;
      return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
    }

    if (typeof dateValue === "object" && dateValue.year) {
      const day = dateValue.dayOfMonth || dateValue.day || 1;
      const month = dateValue.monthValue || dateValue.month || 1;
      return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${dateValue.year}`;
    }

    return "Data indefinida";
  };

  const isPastDate = (dateString) => {
    if (!dateString) return false;

    let dateToCompare = dateString;
    if (Array.isArray(dateString)) {
      dateToCompare = `${dateString[0]}-${String(dateString[1]).padStart(2, "0")}-${String(dateString[2]).padStart(2, "0")}`;
    } else if (typeof dateString === "object" && dateString.year) {
      dateToCompare = `${dateString.year}-${String(dateString.monthValue || dateString.month || 1).padStart(2, "0")}-${String(dateString.dayOfMonth || dateString.day || 1).padStart(2, "0")}`;
    }

    const today = new Date().toISOString().split("T")[0];
    return dateToCompare < today;
  };

  const isPastOrToday = (dateValue) => {
    if (!dateValue) return false;
    let dateStr = dateValue;
    if (Array.isArray(dateValue)) {
      dateStr = `${dateValue[0]}-${String(dateValue[1]).padStart(2, "0")}-${String(dateValue[2]).padStart(2, "0")}`;
    } else if (typeof dateValue === "object") {
      dateStr = `${dateValue.year}-${String(dateValue.monthValue || dateValue.month || 1).padStart(2, "0")}-${String(dateValue.dayOfMonth || dateValue.day || 1).padStart(2, "0")}`;
    }

    const today = new Date().toISOString().split("T")[0];
    return dateStr <= today;
  };

  return (
    <div className="p-8 text-white w-full max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FiGift className="text-fuchsia-500" /> Dedicatórias do Duo
        </h1>
        <Link
          to="/buscar"
          className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all hover:scale-105 shadow-md"
        >
          <FiSearch size={18} /> Nova Dedicatória Surpresa
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 mb-6">
        <button
          onClick={() => {
            if (activeTab !== "received") {
              setLoading(true);
              setActiveTab("received");
            }
          }}
          className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors cursor-pointer ${
            activeTab === "received"
              ? "border-b-2 border-fuchsia-500 text-fuchsia-500"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <FiGift /> Recebidas
        </button>
        <button
          onClick={() => {
            if (activeTab !== "sent") {
              setLoading(true);
              setActiveTab("sent");
            }
          }}
          className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors cursor-pointer ${
            activeTab === "sent"
              ? "border-b-2 border-fuchsia-500 text-fuchsia-500"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <FiSend /> Enviadas
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-gray-400 text-center py-10">
          Carregando dedicatórias...
        </div>
      ) : dedications.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/50 rounded-2xl border border-gray-800">
          <FiMusic className="text-6xl text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma dedicatória encontrada.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {dedications.map((dedication) => (
            <div
              key={dedication.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col justify-between hover:border-gray-700 transition-colors"
            >
              {/* Header: Data e Aviso de Atraso */}
              <div className="mb-4">
                <span className="text-xs font-bold text-gray-500 bg-gray-800 px-2 py-1 rounded">
                  {formatDate(
                    dedication.scheduleDate || dedication.scheduledDate,
                  )}
                </span>
                {activeTab === "received" &&
                  isPastDate(
                    dedication.scheduleDate || dedication.scheduledDate,
                  ) && (
                    <p className="text-xs text-yellow-500 mt-2 flex items-center gap-1">
                      <FiAlertCircle /> Sua dupla programou esta música para o
                      dia{" "}
                      {formatDate(
                        dedication.scheduleDate || dedication.scheduledDate,
                      )}
                      , mas você não logou a tempo!
                    </p>
                  )}
              </div>

              {/* Corpo: Música */}
              <div className="flex items-center gap-4 mb-4">
                {dedication.imageUrl ? (
                  <img
                    src={dedication.imageUrl}
                    alt={dedication.title}
                    className="w-16 h-16 rounded object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded bg-gray-800 flex items-center justify-center">
                    <FiMusic className="text-gray-500 text-2xl" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3
                    className="font-bold text-lg truncate"
                    title={dedication.title}
                  >
                    {dedication.title}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">
                    {dedication.artist}
                  </p>
                </div>
              </div>

              {/* Mensagem (Opcional) */}
              {dedication.message && (
                <div className="bg-gray-800/50 p-3 rounded-lg mb-4 text-sm italic text-gray-300 border-l-2 border-fuchsia-500">
                  "{dedication.message}"
                </div>
              )}

              {/* Botões de Ação */}
              <div className="mt-auto pt-2 border-t border-gray-800 flex justify-end">
                {activeTab === "received" ? (
                  <button
                    onClick={() => handlePlay(dedication)}
                    className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-lg font-bold transition-all hover:scale-105 cursor-pointer"
                  >
                    {!isConnected ? (
                      "Conecte-se Agora"
                    ) : (
                      <>
                        <FiPlay className="fill-current" /> Ouvir Agora
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleDelete(dedication.id)}
                    className="flex items-center gap-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <FiTrash2 />
                    {isPastOrToday(
                      dedication.scheduleDate || dedication.scheduledDate,
                    )
                      ? "Excluir Dedicatória"
                      : "Cancelar Envio"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
