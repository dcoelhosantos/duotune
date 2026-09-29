package br.com.duotune.model;

import br.com.duotune.service.MatchCalculator;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "musical_matches", indexes = @Index(name = "idx_match_duo_date", columnList = "duo_id,calculated_at"))
public class MusicalMatch {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "duo_id", nullable = false)
    private Duo duo;
    @Column(name = "calculated_at", nullable = false)
    private Instant calculatedAt;
    @Column(nullable = false)
    private String formulaVersion;
    @Column(nullable = false)
    private double percentage;
    @Column(nullable = false)
    private double artistSimilarity;
    @Column(nullable = false)
    private double trackSimilarity;
    @Column(nullable = false)
    private double artistPoints;
    @Column(nullable = false)
    private double trackBonus;
    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MatchListeningEntry> entries = new ArrayList<>();

    protected MusicalMatch() {}
    public MusicalMatch(Duo duo, MatchCalculator.Score score) {
        this.duo = duo;
        calculatedAt = Instant.now();
        formulaVersion = MatchCalculator.VERSION;
        percentage = score.percentage();
        artistSimilarity = score.artistSimilarity();
        trackSimilarity = score.trackSimilarity();
        artistPoints = score.artistPoints();
        trackBonus = score.trackBonus();
    }
    public Long getId() { return id; }
    public Duo getDuo() { return duo; }
    public Instant getCalculatedAt() { return calculatedAt; }
    public String getFormulaVersion() { return formulaVersion; }
    public double getPercentage() { return percentage; }
    public double getArtistSimilarity() { return artistSimilarity; }
    public double getTrackSimilarity() { return trackSimilarity; }
    public double getArtistPoints() { return artistPoints; }
    public double getTrackBonus() { return trackBonus; }
    public List<MatchListeningEntry> getEntries() { return entries; }
}
