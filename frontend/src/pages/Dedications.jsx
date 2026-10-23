import DuoRequired from "../components/DuoRequired";
import DuoPageHeading from "../components/DuoPageHeading";
import { useEffect, useState } from "react";
import {
  FiGift,
  FiSend,
  FiTrash2,
  FiPlay,
  FiMusic,
  FiAlertCircle,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { duoApi } from "../duo/api";
import { useSpotify } from "../spotify/SpotifyContext";
import { useNavigate, Link } from "react-router-dom";

function todayInBrazil() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function Dedications() {
  return (
    <DuoRequired
      heading={<DedicationsHeading />}
      icon={<FiGift size={36} />}
      title="Uma música pode dizer muito"
      description="Forme seu Duo para surpreender quem você gosta com músicas e mensagens programadas para dias especiais."
    >
      <DedicationsContent />
    </DuoRequired>
  );
}

function DedicationsHeading() {
  return (
    <DuoPageHeading
      eyebrow="Carinho em forma de música"
      title="Dedicatórias"
      description="Surpreendam um ao outro com músicas e mensagens para dias especiais."
    />
  );
}

function DedicationsContent() {
  const [activeTab, setActiveTab] = useState("received");
  const [dedications, setDedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dedicationToDelete, setDedicationToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

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

  const handleDelete = async () => {
    if (!dedicationToDelete) return;

    const id = dedicationToDelete.id;
    setDeletingId(id);
    setDeleteError("");
    try {
      await duoApi(`/dedications/${id}`, { method: "DELETE" });
      setDedications((items) => items.filter((dedication) => dedication.id !== id));
      setDedicationToDelete(null);
    } catch (err) {
      setDeleteError(err.message || "Não foi possível cancelar a dedicatória. Tente novamente.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (!dedicationToDelete) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && deletingId !== dedicationToDelete.id) {
        setDedicationToDelete(null);
        setDeleteError("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dedicationToDelete, deletingId]);

  const handlePlay = async (dedication) => {
    if (!isConnected) {
      connectSpotify();
      return;
    }

    const started = await playTrack({ id: dedication.trackSpotifyId }, null, true);
    if (!started) return;

    try {
      await duoApi(`/dedications/${dedication.id}/deliver`, { method: "POST" });
      setDedications((items) => items.map((item) =>
        item.id === dedication.id ? { ...item, delivered: true } : item,
      ));
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

    const today = todayInBrazil();
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

    const today = todayInBrazil();
    return dateStr <= today;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DedicationsHeading />
        <Link
          to="/buscar"
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-fuchsia-600 px-5 py-3 text-sm font-semibold transition-colors hover:bg-fuchsia-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400"
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
                  !dedication.delivered &&
                  isPastDate(
                    dedication.scheduleDate || dedication.scheduledDate,
                  ) && (
                    <p className="text-xs text-yellow-500 mt-2 flex items-center gap-1">
                      <FiAlertCircle /> Sua dupla programou esta música para o
                      dia{" "}
                      {formatDate(
                        dedication.scheduleDate || dedication.scheduledDate,
                      )}
                      . Ela ainda está esperando por você!
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
                    onClick={() => {
                      setDeleteError("");
                      setDedicationToDelete(dedication);
                    }}
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

      {dedicationToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              deletingId !== dedicationToDelete.id
            ) {
              setDedicationToDelete(null);
              setDeleteError("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-dedication-title"
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl shadow-black/50"
          >
            <button
              type="button"
              aria-label="Fechar confirmação"
              disabled={deletingId === dedicationToDelete.id}
              onClick={() => {
                setDedicationToDelete(null);
                setDeleteError("");
              }}
              className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiX size={18} />
            </button>

            <h2
              id="cancel-dedication-title"
              className="mb-2 pr-8 text-xl font-bold text-white"
            >
              Cancelar esta surpresa?
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-gray-400">
              A dedicatória será removida e não poderá ser recuperada.
            </p>

            <div className="mb-5 flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-950/70 p-3">
              {dedicationToDelete.imageUrl ? (
                <img
                  src={dedicationToDelete.imageUrl}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-800 text-fuchsia-400">
                  <FiMusic size={20} />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">
                  {dedicationToDelete.title}
                </p>
                <p className="truncate text-sm text-gray-400">
                  {dedicationToDelete.artist}
                </p>
                <p className="mt-1 text-xs text-fuchsia-300">
                  Envio para {formatDate(dedicationToDelete.scheduleDate || dedicationToDelete.scheduledDate)}
                </p>
              </div>
            </div>

            {deleteError && (
              <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {deleteError}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deletingId === dedicationToDelete.id}
                onClick={() => {
                  setDedicationToDelete(null);
                  setDeleteError("");
                }}
                className="rounded-xl border border-gray-700 px-4 py-3 text-sm font-semibold text-gray-200 transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-32"
              >
                Manter dedicatória
              </button>
              <button
                type="button"
                disabled={deletingId === dedicationToDelete.id}
                onClick={handleDelete}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500/90 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-wait disabled:opacity-60 sm:min-w-32"
              >
                <FiTrash2 size={16} />
                {deletingId === dedicationToDelete.id ? "Cancelando..." : "Cancelar envio"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
