import { RoomContext } from "./RoomContext";
import { useRoomConnection } from "./useRoom";

export default function RoomProvider({ children }) {
  const room = useRoomConnection();
  return <RoomContext.Provider value={room}>{children}</RoomContext.Provider>;
}
