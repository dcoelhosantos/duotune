package br.com.duotune.integration.spotify;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import br.com.duotune.exception.ApplicationException;
import br.com.duotune.exception.ErrorType;
import br.com.duotune.repository.TrackMetadataRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

class SpotifyServiceTest {
    @Test
    void searchesSpotifyAndReturnsApplicationTrackData() {
        TrackMetadataRepository metadata = mock(TrackMetadataRepository.class);
        RestTemplate http = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(http).build();
        SpotifyService spotify = new SpotifyService(metadata, "client", "secret", http);

        server.expect(requestTo("https://accounts.spotify.com/api/token"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("""
                        {"access_token":"app-token","token_type":"Bearer","expires_in":3600}
                        """, MediaType.APPLICATION_JSON));
        server.expect(requestTo(org.hamcrest.Matchers.containsString("https://api.spotify.com/v1/search")))
                .andExpect(method(HttpMethod.GET))
                .andExpect(requestTo(org.hamcrest.Matchers.containsString("q=A%20%26%20B")))
                .andExpect(header("Authorization", "Bearer app-token"))
                .andRespond(withSuccess("""
                        {"tracks":{"items":[{"id":"1234567890123456789012","name":"Faixa",
                        "artists":[{"name":"Artista"}],"album":{"images":[{"url":"https://img.test/cover.jpg"}]},
                        "preview_url":null,"is_playable":true,"duration_ms":182000}]}}
                        """, MediaType.APPLICATION_JSON));

        var tracks = spotify.searchTracks("A & B");

        assertEquals(1, tracks.size());
        assertEquals("Faixa", tracks.get(0).title());
        assertEquals("Artista", tracks.get(0).artist());
        assertEquals("https://img.test/cover.jpg", tracks.get(0).imageUrl());
        verify(metadata).saveAll(any());
        server.verify();
    }

    @Test
    void mapsSpotifySearchRateLimitToTooManyRequests() {
        TrackMetadataRepository metadata = mock(TrackMetadataRepository.class);
        RestTemplate http = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(http).build();
        SpotifyService spotify = new SpotifyService(metadata, "client", "secret", http);

        server.expect(requestTo("https://accounts.spotify.com/api/token"))
                .andRespond(withSuccess("{\"access_token\":\"app-token\",\"expires_in\":3600}", MediaType.APPLICATION_JSON));
        server.expect(requestTo(org.hamcrest.Matchers.containsString("https://api.spotify.com/v1/search")))
                .andRespond(org.springframework.test.web.client.response.MockRestResponseCreators.withTooManyRequests());

        ApplicationException error = assertThrows(ApplicationException.class,
                () -> spotify.searchTracks("faixa"));

        assertEquals(ErrorType.RATE_LIMITED, error.getType());
        server.verify();
    }

    @Test
    void reusesAccessTokenUntilItIsCloseToExpiration() {
        TrackMetadataRepository metadata = mock(TrackMetadataRepository.class);
        RestTemplate http = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(http).build();
        SpotifyService spotify = new SpotifyService(metadata, "client", "secret", http);

        server.expect(requestTo("https://accounts.spotify.com/api/token"))
                .andRespond(withSuccess("{\"access_token\":\"app-token\",\"expires_in\":3600}",
                        MediaType.APPLICATION_JSON));
        server.expect(requestTo(org.hamcrest.Matchers.containsString("https://api.spotify.com/v1/search")))
                .andExpect(header("Authorization", "Bearer app-token"))
                .andRespond(withSuccess("{\"tracks\":{\"items\":[]}}", MediaType.APPLICATION_JSON));
        server.expect(requestTo(org.hamcrest.Matchers.containsString("https://api.spotify.com/v1/search")))
                .andExpect(header("Authorization", "Bearer app-token"))
                .andRespond(withSuccess("{\"tracks\":{\"items\":[]}}", MediaType.APPLICATION_JSON));

        spotify.searchTracks("primeira");
        spotify.searchTracks("segunda");

        server.verify();
    }

    @Test
    void renewsAccessTokenWhenItIsWithinSixtySecondsOfExpiration() {
        TrackMetadataRepository metadata = mock(TrackMetadataRepository.class);
        RestTemplate http = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(http).build();
        SpotifyService spotify = new SpotifyService(metadata, "client", "secret", http);

        server.expect(requestTo("https://accounts.spotify.com/api/token"))
                .andRespond(withSuccess("{\"access_token\":\"soon-expired-token\",\"expires_in\":30}",
                        MediaType.APPLICATION_JSON));
        server.expect(requestTo(org.hamcrest.Matchers.containsString("https://api.spotify.com/v1/search")))
                .andExpect(header("Authorization", "Bearer soon-expired-token"))
                .andRespond(withSuccess("{\"tracks\":{\"items\":[]}}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://accounts.spotify.com/api/token"))
                .andRespond(withSuccess("{\"access_token\":\"renewed-token\",\"expires_in\":3600}",
                        MediaType.APPLICATION_JSON));
        server.expect(requestTo(org.hamcrest.Matchers.containsString("https://api.spotify.com/v1/search")))
                .andExpect(header("Authorization", "Bearer renewed-token"))
                .andRespond(withSuccess("{\"tracks\":{\"items\":[]}}", MediaType.APPLICATION_JSON));

        spotify.searchTracks("primeira");
        spotify.searchTracks("segunda");

        server.verify();
    }

    @Test
    void mapsMalformedSpotifySearchResponseToIntegrationFailure() {
        TrackMetadataRepository metadata = mock(TrackMetadataRepository.class);
        RestTemplate http = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(http).build();
        SpotifyService spotify = new SpotifyService(metadata, "client", "secret", http);

        server.expect(requestTo("https://accounts.spotify.com/api/token"))
                .andRespond(withSuccess("{\"access_token\":\"app-token\",\"expires_in\":3600}",
                        MediaType.APPLICATION_JSON));
        server.expect(requestTo(org.hamcrest.Matchers.containsString("https://api.spotify.com/v1/search")))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        ApplicationException error = assertThrows(ApplicationException.class,
                () -> spotify.searchTracks("faixa"));

        assertEquals(ErrorType.INTEGRATION_FAILURE, error.getType());
        server.verify();
    }

    @Test
    void discardsUnauthorizedTokenAndRetriesSearchOnce() {
        TrackMetadataRepository metadata = mock(TrackMetadataRepository.class);
        RestTemplate http = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(http).build();
        SpotifyService spotify = new SpotifyService(metadata, "client", "secret", http);

        server.expect(requestTo("https://accounts.spotify.com/api/token"))
                .andRespond(withSuccess("{\"access_token\":\"rejected-token\",\"expires_in\":3600}",
                        MediaType.APPLICATION_JSON));
        server.expect(requestTo(org.hamcrest.Matchers.containsString("https://api.spotify.com/v1/search")))
                .andExpect(header("Authorization", "Bearer rejected-token"))
                .andRespond(org.springframework.test.web.client.response.MockRestResponseCreators
                        .withStatus(HttpStatus.UNAUTHORIZED));
        server.expect(requestTo("https://accounts.spotify.com/api/token"))
                .andRespond(withSuccess("{\"access_token\":\"fresh-token\",\"expires_in\":3600}",
                        MediaType.APPLICATION_JSON));
        server.expect(requestTo(org.hamcrest.Matchers.containsString("https://api.spotify.com/v1/search")))
                .andExpect(header("Authorization", "Bearer fresh-token"))
                .andRespond(withSuccess("{\"tracks\":{\"items\":[]}}", MediaType.APPLICATION_JSON));
        server.expect(requestTo(org.hamcrest.Matchers.containsString("https://api.spotify.com/v1/search")))
                .andExpect(header("Authorization", "Bearer fresh-token"))
                .andRespond(withSuccess("{\"tracks\":{\"items\":[]}}", MediaType.APPLICATION_JSON));

        spotify.searchTracks("primeira");
        spotify.searchTracks("segunda");

        server.verify();
    }
}
