import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiAlertTriangle, FiTrash2, FiHeart } from "react-icons/fi";
import { duoApi } from "./api";

export default function ManageDuo() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [duoInfo, setDuoInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    let active = true;

    duoApi("/active")
      .then((data) => {
        if (active) setDuoInfo(data.duo);
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

  const handleEndDuo = async () => {
    setIsEnding(true);
    try {
      await duoApi("/active", { method: "DELETE" });

      const updatedUser = { ...storedUser };
      updatedUser.duoId = null;
      localStorage.setItem("user", JSON.stringify(updatedUser));

      window.location.href = "/";
    } catch (err) {
      setError(err.message);
      setIsEnding(false);
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-gray-400 text-center">
        Carregando informações do Duo...
      </div>
    );
  }

  if (error || !duoInfo) {
    return (
      <div className="max-w-3xl mx-auto mt-10 bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Sem Duo Ativo</h2>
        <p className="text-gray-400 mb-6">
          {error || "Você não está em nenhuma parceria musical no momento."}
        </p>
        <button
          onClick={() => navigate("/convidar")}
          className="px-6 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-full font-bold transition-colors"
        >
          Encontrar um Duo
        </button>
      </div>
    );
  }

  // Define quem é o usuário logado e quem é o parceiro buscando na lista 'members'
  const isUser1 = duoInfo.members[0].id === storedUser.id;
  const me = isUser1 ? duoInfo.members[0] : duoInfo.members[1];
  const partner = isUser1 ? duoInfo.members[1] : duoInfo.members[0];

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-4 relative">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">Gerenciar Duo</h1>
        <p className="text-gray-400">
          Visualize as informações da sua parceria musical.
        </p>
      </div>

      {/* Perfis Lado a Lado */}
      <div className="flex flex-col md:flex-row items-start justify-center gap-4 bg-gray-900/50 border border-gray-800 rounded-2xl p-10 mb-10 relative">
        <div className="flex flex-col items-center flex-1 w-full px-2">
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center border-4 border-fuchsia-500/30 mb-4 shadow-lg overflow-hidden shrink-0">
            {me.profileImageUrl ? (
              <img
                src={me.profileImageUrl}
                alt={me.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <FiUser size={40} className="text-gray-400" />
            )}
          </div>
          <h3 className="text-xl font-bold text-white text-center break-words w-full">
            {me.name}
          </h3>
          <span className="text-xs text-fuchsia-400 font-semibold uppercase tracking-widest mt-1 text-center">
            Você
          </span>
        </div>

        <div className="hidden md:flex items-center justify-center shrink-0 mt-8">
          <FiHeart size={32} className="text-fuchsia-500 animate-pulse" />
        </div>

        <div className="flex flex-col items-center flex-1 w-full px-2">
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center border-4 border-fuchsia-500/30 mb-4 shadow-lg overflow-hidden shrink-0">
            {partner.profileImageUrl ? (
              <img
                src={partner.profileImageUrl}
                alt={partner.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <FiUser size={40} className="text-gray-400" />
            )}
          </div>
          <h3 className="text-xl font-bold text-white text-center break-words w-full">
            {partner.name}
          </h3>
          <span className="text-xs text-fuchsia-400 font-semibold uppercase tracking-widest mt-1 text-center">
            Sua Dupla
          </span>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-500/30 bg-red-500/5 rounded-2xl p-6 md:p-8">
        <h3 className="text-xl font-bold text-red-400 mb-2 flex items-center gap-2">
          <FiAlertTriangle /> Zona de Perigo
        </h3>
        <p className="text-gray-400 mb-6 text-sm">
          Encerrar o Duo removerá permanentemente o vínculo entre vocês. As
          playlists compartilhadas e as fusões perderão a sincronização. Essa
          ação não pode ser desfeita.
        </p>
        <button
          onClick={() => setShowConfirmModal(true)}
          className="px-6 py-3 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/50 rounded-xl font-semibold transition-colors flex items-center gap-2 cursor-pointer"
        >
          <FiTrash2 /> Encerrar Parceria
        </button>
      </div>

      {/* Modal de Dupla Confirmação */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">
              Tem certeza absoluta?
            </h3>
            <p className="text-gray-300 mb-8">
              Você está prestes a encerrar a parceria com{" "}
              <strong className="text-fuchsia-400">{partner.name}</strong>.
              Vocês perderão acesso ao espaço compartilhado imediatamente.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isEnding}
                className="px-5 py-2.5 text-gray-400 hover:text-white font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleEndDuo}
                disabled={isEnding}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isEnding ? "Encerrando..." : "Sim, encerrar duo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
