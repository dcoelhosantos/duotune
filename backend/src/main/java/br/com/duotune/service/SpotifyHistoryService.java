package br.com.duotune.service;

import br.com.duotune.dto.RecentPlay;

import br.com.duotune.model.User;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.client.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.*;

@Service
public class SpotifyHistoryService {
    private final SpotifyOAuthService oauth;
    private final RestTemplate http;

    @Autowired
    public SpotifyHistoryService(SpotifyOAuthService oauth) {
        this(oauth, createHttpClient());
    }

    SpotifyHistoryService(SpotifyOAuthService oauth, RestTemplate http) {
        this.oauth = oauth;
        this.http = http;
    }

    private static RestTemplate createHttpClient() {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(15000);
        return new RestTemplate(factory);
    }

    public record Artist(String id, String name) {}
    public record Track(String id, String name, Boolean is_local, List<Artist> artists) {}
    public record Item(Track track, String played_at) {}
    public record Page(List<Item> items) {}

    public List<RecentPlay> recent(User user) {
        try {
            try {
                return fetch(user, false);
            } catch (HttpClientErrorException.Unauthorized expired) {
                return fetch(user, true);
            }
        } catch (HttpClientErrorException.Forbidden denied) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    user.getName() + " precisa autorizar a leitura do histórico. Reconecte o Spotify no perfil dessa pessoa. Se persistir, verifique o acesso da conta ao aplicativo Spotify.");
        } catch (HttpClientErrorException.TooManyRequests limited) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "O Spotify limitou as consultas. Aguarde alguns minutos antes de tentar novamente.");
        } catch (ResponseStatusException error) {
            if (error.getStatusCode().value() == 409) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        user.getName() + " precisa conectar ou reconectar o Spotify no próprio perfil.");
            }
            throw error;
        } catch (RestClientException error) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Não foi possível consultar o Spotify. Tente novamente em instantes.");
        }
    }

    private List<RecentPlay> fetch(User user, boolean force) {
        String token = (String) oauth.token(user.getEmail(), force).get("access_token");
        var headers = new HttpHeaders();
        headers.setBearerAuth(token);
        Page page = http.exchange("https://api.spotify.com/v1/me/player/recently-played?limit=50",
                HttpMethod.GET, new HttpEntity<>(headers), Page.class).getBody();
        return parse(page);
    }

    static List<RecentPlay> parse(Page page) {
        if (page == null || page.items() == null) throw invalidResponse();
        Map<String, RecentPlay> unique = new LinkedHashMap<>();
        for (Item item : page.items().stream().limit(50).toList()) {
            if (item == null || item.track() == null) continue;
            Track track = item.track();
            if (Boolean.TRUE.equals(track.is_local()) || track.id() == null || track.id().isBlank()) continue;
            Map<String, String> artists = new LinkedHashMap<>();
            if (track.artists() != null) for (Artist artist : track.artists()) {
                if (artist != null && artist.id() != null && !artist.id().isBlank())
                    artists.put(artist.id(), artist.name() == null ? "Artista" : artist.name());
            }
            if (artists.isEmpty()) continue;
            Instant playedAt;
            try { playedAt = Instant.parse(item.played_at()); }
            catch (RuntimeException error) { throw invalidResponse(); }
            RecentPlay play = new RecentPlay(track.id(), track.name() == null ? "Música" : track.name(), playedAt, artists);
            unique.put(track.id() + "@" + playedAt, play);
        }
        return List.copyOf(unique.values());
    }

    private static ResponseStatusException invalidResponse() {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, "O Spotify retornou um histórico inválido. Tente novamente.");
    }
}
