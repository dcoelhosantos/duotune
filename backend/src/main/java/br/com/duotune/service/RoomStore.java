package br.com.duotune.service;

import br.com.duotune.dto.RoomDtos.ChatMessage;
import br.com.duotune.dto.RoomDtos.QueueEntry;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.BiConsumer;
import org.springframework.stereotype.Component;

/** Armazenamento local. O RoomService protege cada Room com synchronized(room). */
@Component
public class RoomStore {
    record ReadyLease(String clientId, long expiresAt) {}
    record Connection(Long userId, Set<String> subscriptions) {}
    static class Room {
        long version;
        long playbackRevision;
        boolean playing;
        long positionMs;
        long updatedAt = System.currentTimeMillis();
        final List<QueueEntry> queue = new ArrayList<>();
        final Map<Long, ReadyLease> ready = new HashMap<>();
        final Map<String, Connection> connections = new HashMap<>();
        final Deque<ChatMessage> messages = new ArrayDeque<>();
        final Map<Long, Instant> lastMessageAt = new HashMap<>();
    }

    private final Map<Long, Room> rooms = new ConcurrentHashMap<>();
    private final Map<String, Long> sessionRooms = new ConcurrentHashMap<>();

    Room getOrCreate(Long id) { return rooms.computeIfAbsent(id, key -> new Room()); }
    Room get(Long id) { return rooms.get(id); }
    Long roomIdForSession(String session) { return sessionRooms.get(session); }
    void bindSession(String session, Long id) { sessionRooms.put(session, id); }
    void unbindSession(String session, Long id) { sessionRooms.remove(session, id); }
    void forEach(BiConsumer<Long, Room> action) { rooms.forEach(action); }
}
