package br.com.duotune.service;

import br.com.duotune.dto.RecentPlay;

import br.com.duotune.model.*;
import br.com.duotune.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class MusicalMatchServiceTest {
    private final UserRepository users = mock(UserRepository.class);
    private final DuoRepository duos = mock(DuoRepository.class);
    private final MusicalMatchRepository matches = mock(MusicalMatchRepository.class);
    private final SpotifyHistoryService spotify = mock(SpotifyHistoryService.class);
    private MusicalMatchService service;
    private User first;
    private User second;
    private Duo duo;

    @BeforeEach void setup() {
        var manager = mock(PlatformTransactionManager.class);
        when(manager.getTransaction(any())).thenReturn(mock(TransactionStatus.class));
        service = new MusicalMatchService(users, duos, matches, spotify, manager);
        first = new User(); first.setId(1L); first.setEmail("a@example.com"); first.setName("A");
        second = new User(); second.setId(2L); second.setEmail("b@example.com"); second.setName("B");
        duo = new Duo(); duo.setId(10L); duo.setUser1(first); duo.setUser2(second);
        when(users.findByEmail(first.getEmail())).thenReturn(Optional.of(first));
        when(duos.findActiveDuoId(1L)).thenReturn(Optional.of(10L));
        when(duos.findById(10L)).thenReturn(Optional.of(duo));
    }
    @Test void unpairedUserCannotReadOrCalculateAnotherDuosMatch() {
        when(duos.findActiveDuoId(1L)).thenReturn(Optional.empty());
        assertEquals(404, assertThrows(ResponseStatusException.class, () -> service.overview(first.getEmail())).getStatusCode().value());
        assertThrows(ResponseStatusException.class, () -> service.calculate(first.getEmail()));
        verifyNoInteractions(matches, spotify);
    }
    @Test void failedOrEmptySpotifyHistoryDoesNotOverwriteSavedResults() {
        when(spotify.recent(first)).thenReturn(List.of());
        when(spotify.recent(second)).thenReturn(List.of());
        assertEquals(422, assertThrows(ResponseStatusException.class, () -> service.calculate(first.getEmail())).getStatusCode().value());
        verify(matches, never()).save(any());
    }
    @Test void storesBothSamplesAndReturnsOnlySharedItems() {
        var shared = new RecentPlay("track", "Música", Instant.EPOCH, Map.of("artist", "Artista"));
        var privateTrack = new RecentPlay("private", "Só uma pessoa ouviu", Instant.EPOCH, Map.of("other", "Outro"));
        when(spotify.recent(first)).thenReturn(List.of(shared, privateTrack));
        when(spotify.recent(second)).thenReturn(List.of(shared));
        when(matches.save(any())).thenAnswer(invocation -> {
            MusicalMatch match = invocation.getArgument(0);
            when(matches.findTop10ByDuoIdOrderByCalculatedAtDescIdDesc(10L)).thenReturn(List.of(match));
            return match;
        });
        var response = service.calculate(first.getEmail()).latest();
        assertEquals(1, response.sharedTracks().size());
        assertEquals("track", response.sharedTracks().get(0).id());
        assertEquals(2, response.members().get(0).plays());
        verify(matches).save(argThat(match -> match.getEntries().size() == 3));
    }
}
