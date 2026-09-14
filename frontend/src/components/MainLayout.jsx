import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full">
        <Topbar />
        {/* Aqui é onde a página real (ex: Biblioteca) vai ser renderizada */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
