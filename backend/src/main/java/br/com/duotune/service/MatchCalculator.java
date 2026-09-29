package br.com.duotune.service;

import br.com.duotune.dto.RecentPlay;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/** Regra pura: artistas formam a base; faixas iguais preenchem parte do restante. */
public final class MatchCalculator {
    public static final String VERSION = "artists-80-tracks-bonus-v1";
    private MatchCalculator() {}

    public record Score(double percentage, double artistSimilarity, double trackSimilarity,
                        double artistPoints, double trackBonus) {}

    public static Score calculate(List<RecentPlay> first, List<RecentPlay> second) {
        if (first.isEmpty() || second.isEmpty()) {
            throw new IllegalArgumentException("Os dois históricos precisam ter músicas.");
        }
        double artists = dice(artistIds(first), artistIds(second));
        double tracks = dice(trackIds(first), trackIds(second));
        double base = 80 * artists;
        double bonus = (100 - base) * tracks;
        return new Score(round(base + bonus), round(artists * 100), round(tracks * 100),
                round(base), round(bonus));
    }

    public static Set<String> artistIds(List<RecentPlay> plays) {
        return plays.stream().flatMap(play -> play.artists().keySet().stream()).collect(Collectors.toSet());
    }

    public static Set<String> trackIds(List<RecentPlay> plays) {
        return plays.stream().map(RecentPlay::trackId).collect(Collectors.toSet());
    }

    private static double dice(Set<String> first, Set<String> second) {
        if (first.isEmpty() && second.isEmpty()) return 0;
        long shared = first.stream().filter(second::contains).count();
        return 2.0 * shared / (first.size() + second.size());
    }

    private static double round(double value) { return Math.round(value * 10) / 10.0; }
}
