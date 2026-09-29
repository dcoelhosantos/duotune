package br.com.duotune.model;

import br.com.duotune.dto.RecentPlay;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/** Uma reprodução na amostra de um cálculo, preservada para explicar o resultado. */
@Entity
@Table(name = "match_listening_entries", uniqueConstraints = @UniqueConstraint(
        columnNames = {"match_id", "user_id", "track_id", "played_at"}))
public class MatchListeningEntry {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "match_id", nullable = false)
    private MusicalMatch match;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(name = "track_id", nullable = false)
    private String trackId;
    @Column(nullable = false, columnDefinition = "text")
    private String trackName;
    @Column(name = "played_at", nullable = false)
    private Instant playedAt;
    @ElementCollection
    @CollectionTable(name = "match_entry_artists", joinColumns = @JoinColumn(name = "entry_id"))
    @MapKeyColumn(name = "artist_id")
    @Column(name = "artist_name", columnDefinition = "text")
    private Map<String, String> artists = new HashMap<>();

    protected MatchListeningEntry() {}
    public MatchListeningEntry(MusicalMatch match, User user, RecentPlay play) {
        this.match = match;
        this.user = user;
        trackId = play.trackId();
        trackName = play.trackName();
        playedAt = play.playedAt();
        artists.putAll(play.artists());
    }
    public User getUser() { return user; }
    public RecentPlay toPlay() { return new RecentPlay(trackId, trackName, playedAt, Map.copyOf(artists)); }
}
