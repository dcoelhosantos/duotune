import { FiHome, FiMusic, FiHeart, FiSearch, FiUsers } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-950 border-r border-gray-900 flex flex-col h-full p-6">
      <div className="text-3xl font-bold text-white mb-10">
        Duo<span className="text-fuchsia-500">Tune</span>
      </div>

      <nav className="space-y-4 flex-1">
        <Link
          to="/"
          className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors font-medium"
        >
          <FiHome size={24} /> Início
        </Link>
        <Link
          to="/search"
          className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors font-medium"
        >
          <FiSearch size={24} /> Buscar
        </Link>
        <Link
          to="/"
          className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors font-medium"
        >
          <FiMusic size={24} /> Sua Biblioteca
        </Link>
      </nav>

      <div className="mt-auto space-y-4 pt-6 border-t border-gray-900">
        <Link
          to="#"
          className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors text-sm"
        >
          <FiHeart size={20} /> Músicas Curtidas
        </Link>
        <Link
          to="#"
          className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors text-sm"
        >
          <FiUsers size={20} /> Match Musical
        </Link>
      </div>
    </aside>
  );
}
