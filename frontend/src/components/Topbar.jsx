import { FiSearch, FiUser } from "react-icons/fi";

export default function Topbar() {
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

      <div className="flex items-center gap-3 bg-gray-900 rounded-full py-1.5 px-4 cursor-pointer hover:bg-gray-800 transition-colors border border-gray-800">
        <div className="bg-fuchsia-600 rounded-full p-1.5">
          <FiUser size={18} className="text-white" />
        </div>
        <span className="text-sm font-medium text-white">Meu Perfil</span>
      </div>
    </header>
  );
}
