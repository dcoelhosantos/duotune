package br.com.duotune.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "track_metadata")
public class TrackMetadata {
    @Id
    private String id;
    private Long durationMs;

    protected TrackMetadata() {}
    public TrackMetadata(String id, Long durationMs) {
        this.id = id;
        this.durationMs = durationMs;
    }
    public String getId() { return id; }
    public Long getDurationMs() { return durationMs; }
}
