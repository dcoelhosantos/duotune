package br.com.duotune.dto;



import java.time.Instant;
import java.util.List;

public record MatchResponse(Long id, Instant calculatedAt, String formulaVersion, double percentage,
        double artistSimilarity, double trackSimilarity, double artistPoints, double trackBonus,
        List<Member> members, List<SharedItem> sharedArtists, List<SharedItem> sharedTracks) {
    public record Member(String name, int plays, int tracks, int artists, Instant oldestPlay, Instant newestPlay) {}
    public record SharedItem(String id, String name) {}
    public record History(Long id, Instant calculatedAt, double percentage) {}
    public record Overview(MatchResponse latest, List<History> history) {}
}
