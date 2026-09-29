import { FiHeadphones, FiHome, FiUsers } from "react-icons/fi";
import { Link, NavLink } from "react-router-dom";
import { useRoom } from "../room/RoomContext";

export default function Sidebar() {
  const { info, snapshot, joined } = useRoom();
  const partnerWaiting =
    !joined &&
    info &&
    snapshot?.onlineUserIds.some((id) => id !== info.currentUserId);
  return (
    <aside className="w-16 shrink-0 bg-gray-950 border-r border-gray-900 flex flex-col h-full p-3 md:w-64 md:p-6">
      <div className="text-xl md:text-3xl font-bold text-white mb-10">
        <span className="md:hidden" aria-label="DuoTune">
          D<span className="text-fuchsia-500">.</span>
        </span>
        <span className="hidden md:inline">
          Duo<span className="text-fuchsia-500">Tune</span>
        </span>
      </div>

      <nav className="space-y-4 flex-1">
        <Link
          to="/"
          className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors font-medium"
        >
          <FiHome size={24} className="shrink-0" />{" "}
          <span className="sr-only md:not-sr-only">Início</span>
        </Link>
        <div className="border-t border-gray-800 pt-6 mt-7">
          <p className="sr-only md:not-sr-only md:mb-6 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Seu Duo
          </p>
          <NavLink
            to="/sala"
            title={
              partnerWaiting ? "Seu Duo está esperando na sala" : "Sala Musical"
            }
            className={({ isActive }) =>
              `flex items-center gap-4 rounded-xl px-3 py-3 -mx-3 font-medium transition-colors ${isActive ? "bg-fuchsia-500/10 text-fuchsia-300" : "text-gray-300 hover:bg-gray-900 hover:text-white"}`
            }
          >
            <span className="relative shrink-0">
              <FiHeadphones size={24} />
              {partnerWaiting && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 motion-safe:animate-pulse"
                />
              )}
            </span>
            <span className="sr-only md:not-sr-only">
              Sala Musical
              {partnerWaiting && (
                <span className="mt-1 block text-xs text-emerald-300">
                  Seu Duo está esperando
                </span>
              )}
            </span>
          </NavLink>
          <NavLink
            to="/match"
            title="Match Musical"
            className={({ isActive }) =>
              `flex items-center gap-4 rounded-xl px-3 py-3 -mx-3 font-medium transition-colors ${isActive ? "bg-fuchsia-500/10 text-fuchsia-300" : "text-gray-300 hover:bg-gray-900 hover:text-white"}`
            }
          >
            <FiUsers size={24} className="shrink-0" />
            <span className="sr-only md:not-sr-only">Match Musical</span>
          </NavLink>
        </div>
      </nav>
    </aside>
  );
}
