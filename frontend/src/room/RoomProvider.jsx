import { RoomContext } from "./RoomContext";
import { useRoomConnection } from "./useRoom";

import { useRoomPlayback } from "./useRoomPlayback";

export default function RoomProvider({ children }) {
  const room = useRoomConnection();
  const playback = useRoomPlayback(room);
  return (
    <RoomContext.Provider value={{ ...room, ...playback }}>
      {children}
    </RoomContext.Provider>
  );
}
