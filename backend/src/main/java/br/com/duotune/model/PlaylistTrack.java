package br.com.duotune.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "playlist_tracks", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "playlist_id", "track_spotify_id" })
})
public class PlaylistTrack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "playlist_id", nullable = false)
    private Playlist playlist;

    @Column(name = "track_spotify_id", nullable = false, length = 255)
    private String trackSpotifyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "added_by_user_id", nullable = false)
    private User addedByUser;

    @Column(nullable = false)
    private Integer position;

    @Column(name = "added_at", nullable = false)
    private OffsetDateTime addedAt = OffsetDateTime.now();

    public PlaylistTrack() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Playlist getPlaylist() {
        return playlist;
    }

    public void setPlaylist(Playlist playlist) {
        this.playlist = playlist;
    }

    public String getTrackSpotifyId() {
        return trackSpotifyId;
    }

    public void setTrackSpotifyId(String trackSpotifyId) {
        this.trackSpotifyId = trackSpotifyId;
    }

    public User getAddedByUser() {
        return addedByUser;
    }

    public void setAddedByUser(User addedByUser) {
        this.addedByUser = addedByUser;
    }

    public Integer getPosition() {
        return position;
    }

    public void setPosition(Integer position) {
        this.position = position;
    }

    public OffsetDateTime getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(OffsetDateTime addedAt) {
        this.addedAt = addedAt;
    }
}