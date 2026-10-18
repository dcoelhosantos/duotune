package br.com.duotune.integration.spotify;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import br.com.duotune.exception.ApplicationException;
import br.com.duotune.exception.ErrorType;
import br.com.duotune.model.User;
import br.com.duotune.repository.UserRepository;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

class SpotifyOAuthServiceTest {
    @Test
    void refreshesAnExpiredAccountTokenAndKeepsTheExistingRefreshToken() {
        UserRepository users = mock(UserRepository.class);
        User user = new User();
        user.setEmail("person@example.com");
        user.setSpotifyAccessToken("expired-token");
        user.setSpotifyRefreshToken("refresh-token");
        user.setSpotifyExpiresAt(Instant.now().minusSeconds(1));
        when(users.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        RestTemplate http = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(http).build();
        server.expect(requestTo("https://accounts.spotify.com/api/token"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers.header(
                        "Authorization", "Basic " + Base64.getEncoder().encodeToString("client:secret".getBytes())))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("grant_type=refresh_token")))
                .andRespond(withSuccess("""
                        {"access_token":"fresh-token","token_type":"Bearer","expires_in":3600}
                        """, MediaType.APPLICATION_JSON));

        SpotifyOAuthService spotify = new SpotifyOAuthService(users, "client", "secret", "https://app.test/callback", http);

        Map<String, Object> token = spotify.token(user.getEmail(), false);

        assertEquals("fresh-token", token.get("access_token"));
        assertEquals("refresh-token", user.getSpotifyRefreshToken());
        assertFalse(user.getSpotifyExpiresAt().isBefore(Instant.now()));
        verify(users).save(user);
        server.verify();
    }

    @Test
    void removesTheConnectionWhenSpotifyRejectsTheRefreshToken() {
        UserRepository users = mock(UserRepository.class);
        User user = new User();
        user.setEmail("person@example.com");
        user.setSpotifyAccessToken("expired-token");
        user.setSpotifyRefreshToken("revoked-token");
        user.setSpotifyExpiresAt(Instant.now().minusSeconds(1));
        when(users.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        RestTemplate http = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(http).build();
        server.expect(requestTo("https://accounts.spotify.com/api/token"))
                .andRespond(org.springframework.test.web.client.response.MockRestResponseCreators
                        .withBadRequest().body("{\"error\":\"invalid_grant\"}")
                        .contentType(MediaType.APPLICATION_JSON));

        SpotifyOAuthService spotify = new SpotifyOAuthService(users, "client", "secret", "https://app.test/callback", http);

        ApplicationException error = assertThrows(ApplicationException.class,
                () -> spotify.token(user.getEmail(), false));

        assertEquals(ErrorType.CONFLICT, error.getType());
        assertEquals(null, user.getSpotifyAccessToken());
        assertEquals(null, user.getSpotifyRefreshToken());
        assertEquals(null, user.getSpotifyExpiresAt());
        verify(users).save(user);
        server.verify();
    }
}
