package br.com.duotune.service;

import br.com.duotune.config.StompAccessInterceptor;
import br.com.duotune.model.User;
import br.com.duotune.repository.DuoRepository;
import br.com.duotune.repository.UserRepository;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.socket.messaging.*;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RoomService {
    public record Member(Long id, String name, String profileImageUrl) {}
    public record ChatMessage(String id, String clientId, Long senderId, String senderName, String text, Instant sentAt) {}
    public record State(Long duoId, long version, List<Long> onlineUserIds, List<ChatMessage> messages) {}
    public record RoomInfo(Long duoId, Long currentUserId, List<Member> members, State state) {}
    public record ChatRequest(String clientId, String text) {}
    private record Connection(Long userId, Set<String> subscriptions) {}
    private static class Room {
        long version;
        final Map<String, Connection> connections = new HashMap<>();
        final Deque<ChatMessage> messages = new ArrayDeque<>();
        final Map<Long, Instant> lastMessageAt = new HashMap<>();
    }

    private final UserRepository users;
    private final DuoRepository duos;
    private final SimpMessagingTemplate messaging;
    private final StompAccessInterceptor access;
    private final Map<Long, Room> rooms = new ConcurrentHashMap<>();
    private final Map<String, Long> sessionRooms = new ConcurrentHashMap<>();

    public RoomService(UserRepository users, DuoRepository duos, SimpMessagingTemplate messaging, StompAccessInterceptor access) {
        this.users = users; this.duos = duos; this.messaging = messaging; this.access = access;
    }

    private User user(String email) {
        return users.findByEmail(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Entre novamente para acessar a sala."));
    }
    private Long duoId(User user) {
        return duos.findActiveDuoId(user.getId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Forme um Duo para entrar na sala musical."));
    }
    private Member member(User user) { return new Member(user.getId(), user.getName(), user.getProfileImageUrl()); }

    @Transactional(readOnly = true)
    public RoomInfo current(String email) {
        User user = user(email);
        Long id = duoId(user);
        var duo = duos.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Duo não encontrado."));
        Room room = rooms.computeIfAbsent(id, key -> new Room());
        synchronized (room) {
            return new RoomInfo(id, user.getId(), List.of(member(duo.getUser1()), member(duo.getUser2())), state(id, room));
        }
    }

    @Transactional(readOnly = true)
    public State chat(String email, ChatRequest request) {
        User user = user(email);
        Long id = duoId(user);
        String text = request.text() == null ? "" : request.text().strip();
        if (text.isEmpty() || text.length() > 800) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escreva uma mensagem de até 800 caracteres.");
        }
        try { UUID.fromString(request.clientId()); }
        catch (Exception error) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identificador da mensagem inválido. Tente novamente."); }
        Room room = rooms.computeIfAbsent(id, key -> new Room());
        synchronized (room) {
            if (!online(room).contains(user.getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Conecte-se à sala antes de enviar uma mensagem.");
            }
            if (room.messages.stream().anyMatch(message -> message.senderId().equals(user.getId()) && message.clientId().equals(request.clientId()))) {
                return state(id, room);
            }
            Instant now = Instant.now();
            Instant previous = room.lastMessageAt.get(user.getId());
            if (previous != null && previous.plusMillis(500).isAfter(now)) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Aguarde um instante antes de enviar outra mensagem.");
            }
            room.lastMessageAt.put(user.getId(), now);
            room.messages.addLast(new ChatMessage(UUID.randomUUID().toString(), request.clientId(), user.getId(), user.getName(), text, now));
            while (room.messages.size() > 30) room.messages.removeFirst();
            room.version++;
            State state = state(id, room);
            messaging.convertAndSend(destination(id), state);
            return state;
        }
    }

    private List<Long> online(Room room) {
        return room.connections.entrySet().stream().filter(entry -> access.isSessionActive(entry.getKey()))
                .map(entry -> entry.getValue().userId()).distinct().sorted().toList();
    }
    private State state(Long id, Room room) { return new State(id, room.version, online(room), List.copyOf(room.messages)); }
    private String destination(Long id) { return "/topic/duos/" + id + "/room"; }

    @EventListener
    public void subscribed(SessionSubscribeEvent event) {
        if (event.getUser() == null) return;
        var headers = StompHeaderAccessor.wrap(event.getMessage());
        User user = user(event.getUser().getName());
        Long id = duoId(user);
        if (!destination(id).equals(headers.getDestination()) || headers.getSessionId() == null || headers.getSubscriptionId() == null) return;
        Room room = rooms.computeIfAbsent(id, key -> new Room());
        synchronized (room) {
            String session = headers.getSessionId();
            room.connections.computeIfAbsent(session, key -> new Connection(user.getId(), new HashSet<>()))
                    .subscriptions().add(headers.getSubscriptionId());
            sessionRooms.put(session, id);
            room.version++;
            messaging.convertAndSend(destination(id), state(id, room));
        }
    }

    @EventListener
    public void unsubscribed(SessionUnsubscribeEvent event) {
        var headers = StompHeaderAccessor.wrap(event.getMessage());
        leave(headers.getSessionId(), headers.getSubscriptionId());
    }
    @EventListener
    public void disconnected(SessionDisconnectEvent event) { leave(event.getSessionId(), null); }

    private void leave(String session, String subscription) {
        if (session == null) return;
        Long id = sessionRooms.get(session);
        if (id == null) return;
        Room room = rooms.get(id);
        if (room == null) return;
        synchronized (room) {
            Connection connection = room.connections.get(session);
            if (connection == null) return;
            if (subscription == null) connection.subscriptions().clear();
            else connection.subscriptions().remove(subscription);
            if (connection.subscriptions().isEmpty()) {
                room.connections.remove(session);
                sessionRooms.remove(session, id);
            }
            room.version++;
            messaging.convertAndSend(destination(id), state(id, room));
        }
    }
}
