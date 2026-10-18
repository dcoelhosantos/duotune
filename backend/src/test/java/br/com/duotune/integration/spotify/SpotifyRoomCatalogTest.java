package br.com.duotune.integration.spotify;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;

import br.com.duotune.exception.ApplicationException;
import br.com.duotune.exception.ErrorType;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

class SpotifyRoomCatalogTest {
    @Test
    void mapsSpotifyRateLimitToTooManyRequests() {
        SpotifyOAuthService oauth = mock(SpotifyOAuthService.class);
        when(oauth.token("person@example.com", false)).thenReturn(Map.of("access_token", "valid-token"));
        RestTemplate http = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(http).build();
        server.expect(requestTo("https://api.spotify.com/v1/me"))
                .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers.method(HttpMethod.GET))
                .andExpect(header("Authorization", "Bearer valid-token"))
                .andRespond(org.springframework.test.web.client.response.MockRestResponseCreators.withTooManyRequests());

        SpotifyRoomCatalog catalog = new SpotifyRoomCatalog(oauth, http);
        ApplicationException error = assertThrows(ApplicationException.class,
                () -> catalog.requirePremium("person@example.com"));

        assertEquals(ErrorType.RATE_LIMITED, error.getType());
        server.verify();
    }
}
