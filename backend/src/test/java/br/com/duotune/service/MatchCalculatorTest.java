package br.com.duotune.service;

import br.com.duotune.dto.RecentPlay;

import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class MatchCalculatorTest {
    private RecentPlay play(String track, String artist) {
        return new RecentPlay(track, track, Instant.EPOCH, Map.of(artist, artist));
    }
    @Test void sameArtistsWithoutSharedTracksStillGiveEightyPercent() {
        var score = MatchCalculator.calculate(List.of(play("a", "artist")), List.of(play("b", "artist")));
        assertEquals(80, score.percentage());
        assertEquals(0, score.trackBonus());
    }
    @Test void halfTheTracksSharedRaisesEightyToNinety() {
        var score = MatchCalculator.calculate(List.of(play("a", "artist"), play("b", "artist")),
                List.of(play("a", "artist"), play("c", "artist")));
        assertEquals(90, score.percentage());
        assertEquals(10, score.trackBonus());
    }
    @Test void identicalRepertoiresGiveOneHundredAndDisjointGiveZero() {
        var first = List.of(play("a", "x"), play("b", "y"));
        assertEquals(100, MatchCalculator.calculate(first, first).percentage());
        assertEquals(0, MatchCalculator.calculate(first, List.of(play("c", "z"))).percentage());
    }
    @Test void duplicatesAndParticipantOrderDoNotChangeTheScore() {
        var first = List.of(play("a", "x"), play("b", "y"));
        var second = List.of(play("a", "x"), play("c", "z"));
        var score = MatchCalculator.calculate(first, second);
        assertEquals(70, score.percentage());
        assertEquals(score, MatchCalculator.calculate(second, first));
        assertEquals(score, MatchCalculator.calculate(List.of(play("a", "x"), play("a", "x"), play("b", "y")), second));
    }
    @Test void allCreditedArtistsCountAndNamesAreNotIdentifiers() {
        var collaboration = new RecentPlay("a", "a", Instant.EPOCH, Map.of("x", "Nome", "y", "Outro"));
        var other = new RecentPlay("b", "b", Instant.EPOCH, Map.of("z", "Nome"));
        assertEquals(0, MatchCalculator.calculate(List.of(collaboration), List.of(other)).percentage());
        assertEquals(66.7, MatchCalculator.calculate(List.of(collaboration), List.of(play("c", "y"))).artistSimilarity());
    }
    @Test void emptyHistoryIsNotZeroCompatibility() {
        assertThrows(IllegalArgumentException.class, () -> MatchCalculator.calculate(List.of(), List.of(play("a", "x"))));
    }
}
