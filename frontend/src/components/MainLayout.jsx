import { Outlet } from "react-router-dom";
import RoomProvider from "../room/RoomProvider";
import SpotifyProvider from "../spotify/SpotifyProvider";
import Sidebar from "./Sidebar";
import SpotifyPlayer from "./SpotifyPlayer";
import Topbar from "./Topbar";

export default function MainLayout() {
  return (
    <SpotifyProvider>
      <RoomProvider>
      <div className="flex h-screen bg-gray-900 overflow-hidden text-white">
        <Sidebar />
        <div className="min-w-0 flex-1 flex flex-col h-full">
          <Topbar />
          <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
            <Outlet />
          </main>
          <SpotifyPlayer />
        </div>
      </div>
      </RoomProvider>
    </SpotifyProvider>
  );
}
