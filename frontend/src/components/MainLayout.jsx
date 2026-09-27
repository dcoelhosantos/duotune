import { Outlet } from "react-router-dom";
import SpotifyProvider from "../spotify/SpotifyProvider";
import Sidebar from "./Sidebar";
import SpotifyPlayer from "./SpotifyPlayer";
import Topbar from "./Topbar";

export default function MainLayout() {
  return (
    <SpotifyProvider>
      <div className="flex h-screen bg-gray-900 overflow-hidden text-white">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-8">
            <Outlet />
          </main>
          <SpotifyPlayer />
        </div>
      </div>
    </SpotifyProvider>
  );
}
