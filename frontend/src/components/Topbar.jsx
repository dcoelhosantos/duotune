import { useState } from "react";
import { FiSearch, FiUser, FiChevronDown, FiLogOut } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

export default function Topbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const hasDuo = !!storedUser.duoId;

  const userName = storedUser.name
    ? storedUser.name.split(" ")[0]
    : "Meu Perfil";

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setIsDropdownOpen(false);
  };

  const confirmLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("pendingInvite");
    navigate("/entrar");
  };

  return (
    <>
      <header className="h-20 bg-gray-950 flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="relative w-96">
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="O que você quer ouvir?"
            className="w-full bg-gray-900 text-white rounded-full py-3 pl-12 pr-4 border border-gray-800 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all"
          />
        </div>

        <div className="relative">
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 bg-gray-900 rounded-full py-1.5 px-4 cursor-pointer hover:bg-gray-800 transition-colors border border-gray-800"
          >
            <div className="bg-fuchsia-600 rounded-full p-1.5">
              <FiUser size={18} className="text-white" />
            </div>
            <span className="text-sm font-medium text-white select-none">
              {userName}
            </span>
            <FiChevronDown
              className={`text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </div>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl py-2 z-50 overflow-hidden">
              <Link
                to="#"
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                Gerenciar Perfil
              </Link>

              {hasDuo ? (
                <Link
                  to="#"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  Gerenciar Duo
                </Link>
              ) : (
                <>
                  <Link
                    to="/convidar"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    Enviar Convite
                  </Link>
                  <Link
                    to="/aceitar"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    Aceitar Convite
                  </Link>
                </>
              )}

              <div className="border-t border-gray-800 my-1"></div>
              <button
                onClick={handleLogoutClick}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <FiLogOut size={16} />
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      {showLogoutModal && (
        <div
          onClick={() => setShowLogoutModal(false)}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#170c30] p-8 rounded-2xl border border-purple-900/50 max-w-sm w-full text-center shadow-2xl"
          >
            <h4 className="text-xl font-bold text-white mb-3">
              Sair da conta?
            </h4>
            <p className="text-gray-400 text-base mb-8">
              Tem certeza que deseja encerrar sua sessão? Você precisará fazer
              login novamente.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 rounded-xl font-medium bg-gray-800 hover:bg-gray-700 text-white transition-colors cursor-pointer text-base"
              >
                Cancelar
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-3 rounded-xl font-medium bg-red-600/90 hover:bg-red-500 text-white transition-colors cursor-pointer shadow-[0_0_15px_-3px_rgba(220,38,38,0.4)] text-base"
              >
                Sim, sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
