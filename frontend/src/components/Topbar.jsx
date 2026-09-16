import { useState } from "react";
import { FiSearch, FiUser, FiChevronDown, FiLogOut } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

export default function Topbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  // MOCK: Altere para 'true' para testar a visão de quem já tem um Duo.
  // IMPORTANTE: Isso será substituído pelos dados reais após implementação da Issue #40.
  const hasDuo = false;

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
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
            Meu Perfil
          </span>
          <FiChevronDown
            className={`text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
          />
        </div>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-1 w-42 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl py-2 z-50 overflow-hidden">
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
                  to="/generate-invite"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  Enviar Convite
                </Link>
                <Link
                  to="/accept-invite"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  Aceitar Convite
                </Link>
              </>
            )}

            <div className="border-t border-gray-800 my-1"></div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors flex items-center gap-2"
            >
              <FiLogOut size={16} />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
