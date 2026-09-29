package br.com.duotune.service;



import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Map;
import br.com.duotune.model.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;
import org.springframework.test.web.client.MockRestServiceServer;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;
import static org.junit.jupiter.api.Assertions.*;
import br.com.duotune.service.SpotifyHistoryService.*;

class SpotifyHistoryServiceTest {
    @Test void refreshesExpiredTokenAndDeserializesSpotifyResponse() {
        var oauth = mock(SpotifyOAuthService.class);
        var http = new RestTemplate();
        var server = MockRestServiceServer.bindTo(http).build();
        var user = new User(); user.setEmail("test@example.com");
        when(oauth.token(user.getEmail(), false)).thenReturn(Map.of("access_token", "old"));
        when(oauth.token(user.getEmail(), true)).thenReturn(Map.of("access_token", "new"));
        String url = "https://api.spotify.com/v1/me/player/recently-played?limit=50";
        server.expect(requestTo(url)).andExpect(header("Authorization", "Bearer old"))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED));
        server.expect(requestTo(url)).andExpect(header("Authorization", "Bearer new"))
                .andRespond(withSuccess("""
                    {"items":[{"track":{"id":"track","name":"Música","is_local":false,
                    "album":{"name":"Album"},"artists":[{"id":"artist","name":"Artista","type":"artist"}]},
                    "played_at":"2026-09-28T10:00:00Z","context":null}],"next":null}
                    """, MediaType.APPLICATION_JSON));
        var result = new SpotifyHistoryService(oauth, http).recent(user);
        assertEquals("Música", result.get(0).trackName());
        assertEquals("Artista", result.get(0).artists().get("artist"));
        server.verify();
    }

    @Test void forbiddenHistoryRequestsExplainWhoNeedsAuthorization() {
        var oauth = mock(SpotifyOAuthService.class);
        var http = new RestTemplate();
        var server = MockRestServiceServer.bindTo(http).build();
        var user = new User(); user.setEmail("test@example.com"); user.setName("Pessoa do Duo");
        when(oauth.token(user.getEmail(), false)).thenReturn(Map.of("access_token", "token"));
        server.expect(anything()).andRespond(withStatus(HttpStatus.FORBIDDEN));
        var error = assertThrows(ResponseStatusException.class, () -> new SpotifyHistoryService(oauth, http).recent(user));
        assertEquals(409, error.getStatusCode().value());
        assertTrue(error.getReason().contains("Pessoa do Duo"));
        server.verify();
    }

    @Test void skipsLocalAndUnavailableTracksAndDeduplicatesOnlyTheSameEvent() {
        var artists = List.of(new Artist("artist", "Nome"));
        var track = new Track("track", "Faixa", false, artists);
        var first = new Item(track, "2026-09-28T10:00:00Z");
        var later = new Item(track, "2026-09-28T11:00:00Z");
        var page = new Page(List.of(first, first, later, new Item(null, null),
                new Item(new Track("local", "Local", true, artists), first.played_at())));
        var result = SpotifyHistoryService.parse(page);
        assertEquals(2, result.size());
        assertEquals("Nome", result.get(0).artists().get("artist"));
    }
    @Test void distinguishesAnEmptyHistoryFromAnInvalidResponse() {
        assertTrue(SpotifyHistoryService.parse(new Page(List.of())).isEmpty());
        assertThrows(ResponseStatusException.class, () -> SpotifyHistoryService.parse(new Page(null)));
        var badDate = new Item(new Track("id", "name", false, List.of(new Artist("id", "name"))), "invalid");
        assertThrows(ResponseStatusException.class, () -> SpotifyHistoryService.parse(new Page(List.of(badDate))));
    }
}
