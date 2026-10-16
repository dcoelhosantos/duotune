package br.com.duotune.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "memory_photos")
public class MemoryPhoto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "duo_id", nullable = false)
    private Duo duo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @Column(name = "image_data", nullable = false, columnDefinition = "text")
    private String imageData;

    @Column(name = "track_spotify_id", nullable = false, length = 22)
    private String trackSpotifyId;

    @Column(name = "track_title", nullable = false, length = 255)
    private String trackTitle;

    @Column(name = "track_artist", nullable = false, length = 255)
    private String trackArtist;

    @Column(name = "track_image_url", length = 512)
    private String trackImageUrl;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Duo getDuo() { return duo; }
    public void setDuo(Duo duo) { this.duo = duo; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public String getImageData() { return imageData; }
    public void setImageData(String imageData) { this.imageData = imageData; }
    public String getTrackSpotifyId() { return trackSpotifyId; }
    public void setTrackSpotifyId(String trackSpotifyId) { this.trackSpotifyId = trackSpotifyId; }
    public String getTrackTitle() { return trackTitle; }
    public void setTrackTitle(String trackTitle) { this.trackTitle = trackTitle; }
    public String getTrackArtist() { return trackArtist; }
    public void setTrackArtist(String trackArtist) { this.trackArtist = trackArtist; }
    public String getTrackImageUrl() { return trackImageUrl; }
    public void setTrackImageUrl(String trackImageUrl) { this.trackImageUrl = trackImageUrl; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
