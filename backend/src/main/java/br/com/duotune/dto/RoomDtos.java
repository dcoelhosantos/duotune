package br.com.duotune.dto;

import br.com.duotune.port.music.TrackCatalog;
import java.time.Instant;
import java.util.List;

/** Contratos HTTP e WebSocket da sala, independentes do serviço que os produz. */
public final class RoomDtos {
    private RoomDtos() {}

    public record Member(Long id, String name, String profileImageUrl) {}
    public record ChatMessage(String id, String clientId, Long senderId, String senderName, String text, Instant sentAt) {}
    public record QueueEntry(String id, TrackCatalog.Track track, Long addedBy) {}
    public record ReadyUser(Long userId, String clientId) {}
    public record Playback(long revision, boolean playing, long positionMs, long updatedAt) {}
    public record State(Long duoId, long version, List<Long> onlineUserIds, List<ChatMessage> messages,
                        List<QueueEntry> queue, Playback playback, List<ReadyUser> readyUsers, long serverTime) {}
    public record AddTrackRequest(String trackId) {}
    public record AddPlaylistRequest(List<String> trackIds) {}
    public record PlaybackRequest(String action, Long positionMs, long revision) {}
    public record ReadyRequest(String clientId, boolean ready) {}
    public record RoomInfo(Long duoId, Long currentUserId, List<Member> members, State state) {}
    public record ChatRequest(String clientId, String text) {}
}
