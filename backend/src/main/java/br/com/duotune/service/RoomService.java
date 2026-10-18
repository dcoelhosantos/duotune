package br.com.duotune.service;

import br.com.duotune.port.room.RoomSessionAccess;
import br.com.duotune.dto.RoomDtos.*;
import br.com.duotune.service.RoomStore.*;
import br.com.duotune.integration.room.RoomPublisher;
import br.com.duotune.port.music.TrackCatalog;
import br.com.duotune.model.User;
import br.com.duotune.repository.DuoRepository;
import br.com.duotune.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import br.com.duotune.exception.ApplicationException;
import br.com.duotune.exception.ErrorType;

import java.time.Instant;
import java.util.*;

@Service
@org.springframework.scheduling.annotation.EnableScheduling
public class RoomService {
    private final TrackCatalog catalog;
    private final RoomPlaylistService playlists;
    private final UserRepository users;
    private final DuoRepository duos;
    private final RoomPublisher publisher;
    private final RoomSessionAccess access;
    private final RoomStore rooms;

    public RoomService(UserRepository users, DuoRepository duos, RoomPublisher publisher,
            RoomSessionAccess access, TrackCatalog catalog, RoomPlaylistService playlists, RoomStore rooms) {
        this.rooms = rooms;
        this.playlists = playlists;
        this.catalog = catalog;
        this.users = users;
        this.duos = duos;
        this.publisher = publisher;
        this.access = access;
    }

    private User user(String email) {
        return users.findByEmail(email).orElseThrow(() -> new ApplicationException(ErrorType.UNAUTHENTICATED, "Entre novamente para acessar a sala."));
    }
    private Long duoId(User user) {
        return duos.findActiveDuoId(user.getId()).orElseThrow(() -> new ApplicationException(ErrorType.CONFLICT, "Forme um Duo para entrar na sala musical."));
    }
    private Member member(User user) { return new Member(user.getId(), user.getName(), user.getProfileImageUrl()); }

    @Transactional(readOnly = true)
    public RoomInfo current(String email) {
        User user = user(email);
        Long id = duoId(user);
        var duo = duos.findById(id).orElseThrow(() -> new ApplicationException(ErrorType.NOT_FOUND, "Duo não encontrado."));
        Room room = rooms.getOrCreate(id);
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
            throw new ApplicationException(ErrorType.INVALID_INPUT, "Escreva uma mensagem de até 800 caracteres.");
        }
        try { UUID.fromString(request.clientId()); }
        catch (Exception error) { throw new ApplicationException(ErrorType.INVALID_INPUT, "Identificador da mensagem inválido. Tente novamente."); }
        Room room = rooms.getOrCreate(id);
        synchronized (room) {
            if (!online(room).contains(user.getId())) {
                throw new ApplicationException(ErrorType.CONFLICT, "Conecte-se à sala antes de enviar uma mensagem.");
            }
            if (room.messages.stream().anyMatch(message -> message.senderId().equals(user.getId()) && message.clientId().equals(request.clientId()))) {
                return state(id, room);
            }
            Instant now = Instant.now();
            Instant previous = room.lastMessageAt.get(user.getId());
            if (previous != null && previous.plusMillis(500).isAfter(now)) {
                throw new ApplicationException(ErrorType.RATE_LIMITED, "Aguarde um instante antes de enviar outra mensagem.");
            }
            room.lastMessageAt.put(user.getId(), now);
            room.messages.addLast(new ChatMessage(UUID.randomUUID().toString(), request.clientId(), user.getId(), user.getName(), text, now));
            while (room.messages.size() > 30) room.messages.removeFirst();
            room.version++;
            State state = state(id, room);
            publisher.publish(id, state);
            return state;
        }
    }

    private List<Long> online(Room room) {
        return room.connections.entrySet().stream().filter(entry -> access.isSessionActive(entry.getKey()))
                .map(entry -> entry.getValue().userId()).distinct().sorted().toList();
    }
    private List<ReadyUser> ready(Room room) {
        var online = online(room);
        long now = System.currentTimeMillis();
        return room.ready.entrySet().stream()
                .filter(e -> e.getValue().expiresAt() > now && online.contains(e.getKey()) && access.isClientActive(e.getKey(), e.getValue().clientId()))
                .map(e -> new ReadyUser(e.getKey(), e.getValue().clientId())).toList();
    }

    private long position(Room room) {
        long elapsed = room.playing ? Math.max(0, System.currentTimeMillis() - room.updatedAt) : 0;
        return room.queue.isEmpty() ? 0 : Math.min(room.queue.get(0).track().durationMs(), room.positionMs + elapsed);
    }

    private void playbackChanged(Room room, long position, boolean playing) {
        room.positionMs = position;
        room.playing = playing;
        room.updatedAt = System.currentTimeMillis();
        room.playbackRevision++;
    }

    private State state(Long id, Room room) {
        return new State(id, room.version, online(room), List.copyOf(room.messages), List.copyOf(room.queue),
                new Playback(room.playbackRevision, room.playing, room.positionMs, room.updatedAt),
                ready(room), System.currentTimeMillis());
    }

    private State publish(Long id, Room room) {
        room.version++;
        State state = state(id, room);
        publisher.publish(id, state);
        return state;
    }

    private void requireOnline(Room room, Long userId) {
        if (!online(room).contains(userId)) throw new ApplicationException(ErrorType.CONFLICT, "Entre na sala para alterar a fila ou o player.");
    }

    public State addTrack(String email, AddTrackRequest request) {
        User user = user(email);
        Long id = duoId(user);
        Room room = rooms.getOrCreate(id);
        synchronized (room) { requireOnline(room, user.getId()); }
        var track = catalog.track(email, request.trackId());
        synchronized (room) {
            requireOnline(room, user.getId());
            if (room.queue.size() >= 99) throw new ApplicationException(ErrorType.CONFLICT, "A fila comporta até 99 músicas.");
            room.queue.add(new QueueEntry(UUID.randomUUID().toString(), track, user.getId()));
            if (room.queue.size() == 1) playbackChanged(room, 0, false);
            return publish(id, room);
        }
    }

    public State addPlaylist(String email, Long playlistId, AddPlaylistRequest request) {
        User user = user(email);
        Long id = duoId(user);
        Room room = rooms.getOrCreate(id);
        synchronized (room) { requireOnline(room, user.getId()); }

        var tracks = playlists.select(playlistId, email, request == null ? null : request.trackIds());
        int count = tracks.size();
        synchronized (room) { requirePlaylistCapacity(room, count); }

        // Resolve todas as faixas antes de alterar a fila: falhas não deixam uma importação parcial.
        List<QueueEntry> entries = new ArrayList<>();
        for (var item : tracks) {
            var track = playlists.resolve(playlistId, item, email);
            entries.add(new QueueEntry(UUID.randomUUID().toString(), track, user.getId()));
        }
        if (!id.equals(duoId(user))) throw new ApplicationException(ErrorType.CONFLICT, "Seu Duo mudou. Entre novamente na sala.");
        synchronized (room) {
            requireOnline(room, user.getId());
            requirePlaylistCapacity(room, count);
            boolean empty = room.queue.isEmpty();
            room.queue.addAll(entries);
            if (empty) playbackChanged(room, 0, false);
            return publish(id, room);
        }
    }

    private void requirePlaylistCapacity(Room room, int count) {
        int available = 99 - room.queue.size();
        if (count > available) throw new ApplicationException(ErrorType.CONFLICT,
                "A seleção tem " + count + " músicas e restam " + available + " vagas na fila (limite de 99). Nenhuma música foi adicionada.");
    }

    public State removeTrack(String email, String entryId) {
        User user = user(email);
        Long id = duoId(user);
        Room room = rooms.getOrCreate(id);
        synchronized (room) {
            requireOnline(room, user.getId());
            boolean current = !room.queue.isEmpty() && room.queue.get(0).id().equals(entryId);
            boolean removed = room.queue.removeIf(entry -> entry.id().equals(entryId));
            if (!removed) return state(id, room);
            if (current) playbackChanged(room, 0, room.playing && !room.queue.isEmpty() && ready(room).size() == 2);
            return publish(id, room);
        }
    }

    public State readiness(String email, ReadyRequest request) {
        User user = user(email);
        Long id = duoId(user);
        if (request.clientId() == null || !request.clientId().matches("[a-fA-F0-9-]{36}"))
            throw new ApplicationException(ErrorType.INVALID_INPUT, "Identificador do player inválido.");
        Room room = rooms.getOrCreate(id);
        boolean verify;
        synchronized (room) {
            if (request.ready()) requireOnline(room, user.getId());
            var lease = room.ready.get(user.getId());
            verify = request.ready() && (lease == null || lease.expiresAt() <= System.currentTimeMillis() || !lease.clientId().equals(request.clientId()));
        }
        if (verify) catalog.requirePremium(email);
        synchronized (room) {
            if (request.ready()) {
                requireOnline(room, user.getId());
                if (!access.isClientActive(user.getId(), request.clientId()))
                    throw new ApplicationException(ErrorType.CONFLICT, "Reconecte esta aba à sala antes de habilitar o áudio.");
                var existing = room.ready.get(user.getId());
                if (existing != null && existing.expiresAt() > System.currentTimeMillis() && !existing.clientId().equals(request.clientId()))
                    throw new ApplicationException(ErrorType.CONFLICT, "Seu áudio já está habilitado em outra aba. Saia da sala nessa aba primeiro.");
                for (var participant : ready(room)) {
                    if (!participant.userId().equals(user.getId())) {
                        var partner = users.findById(participant.userId()).orElse(null);
                        if (partner != null && user.getSpotifyId() != null && user.getSpotifyId().equals(partner.getSpotifyId()))
                            throw new ApplicationException(ErrorType.CONFLICT, "Cada participante deve conectar sua própria conta Spotify Premium.");
                    }
                }
                room.ready.put(user.getId(), new ReadyLease(request.clientId(), System.currentTimeMillis() + 90000));
            } else {
                var lease = room.ready.get(user.getId());
                if (lease != null && lease.clientId().equals(request.clientId())) room.ready.remove(user.getId());
            }
            if (room.playing && ready(room).size() != 2) playbackChanged(room, position(room), false);
            return publish(id, room);
        }
    }

    public State playback(String email, PlaybackRequest request) {
        User user = user(email);
        Long id = duoId(user);
        Room room = rooms.getOrCreate(id);
        synchronized (room) {
            requireOnline(room, user.getId());
            if (request.revision() != room.playbackRevision) throw new ApplicationException(ErrorType.CONFLICT, "O player mudou. Tente novamente.");
            if (!"PAUSE".equals(request.action()) && ready(room).size() != 2)
                throw new ApplicationException(ErrorType.CONFLICT, "Os dois precisam estar na sala com seus players Spotify Premium disponíveis.");
            if (room.queue.isEmpty()) throw new ApplicationException(ErrorType.CONFLICT, "Adicione uma música à fila.");
            switch (request.action() == null ? "" : request.action()) {
                case "PLAY" -> playbackChanged(room, position(room), true);
                case "PAUSE" -> playbackChanged(room, position(room), false);
                case "SEEK" -> {
                    if (request.positionMs() == null || request.positionMs() < 0 || request.positionMs() >= room.queue.get(0).track().durationMs())
                        throw new ApplicationException(ErrorType.INVALID_INPUT, "Posição da música inválida.");
                    playbackChanged(room, request.positionMs(), room.playing);
                }
                case "NEXT" -> {
                    room.queue.remove(0);
                    playbackChanged(room, 0, room.playing && !room.queue.isEmpty());
                }
                default -> throw new ApplicationException(ErrorType.INVALID_INPUT, "Comando de reprodução inválido.");
            }
            return publish(id, room);
        }
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 500)
    public void advancePlayback() {
        rooms.forEach((id, room) -> {
            synchronized (room) {
                if (!room.playing) return;
                if (ready(room).size() != 2) {
                    playbackChanged(room, position(room), false);
                    publish(id, room);
                } else if (!room.queue.isEmpty() && position(room) >= room.queue.get(0).track().durationMs()) {
                    room.queue.remove(0);
                    playbackChanged(room, 0, !room.queue.isEmpty());
                    publish(id, room);
                }
            }
        });
    }
    public void subscribe(String email, String destination, String sessionId, String subscriptionId) {
        User user = user(email);
        Long id = duoId(user);
        if (!publisher.isRoomDestination(id, destination) || sessionId == null || subscriptionId == null) return;
        Room room = rooms.getOrCreate(id);
        synchronized (room) {
            String session = sessionId;
            room.connections.computeIfAbsent(session, key -> new Connection(user.getId(), new HashSet<>()))
                    .subscriptions().add(subscriptionId);
            rooms.bindSession(session, id);
            room.version++;
            publisher.publish(id, state(id, room));
        }
    }

    public void leave(String session, String subscription) {
        if (session == null) return;
        Long id = rooms.roomIdForSession(session);
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
                rooms.unbindSession(session, id);
                if (!online(room).contains(connection.userId())) room.ready.remove(connection.userId());
                if (room.playing && ready(room).size() != 2) playbackChanged(room, position(room), false);
            }
            room.version++;
            publisher.publish(id, state(id, room));
        }
    }
}
