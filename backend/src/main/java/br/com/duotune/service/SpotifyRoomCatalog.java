package br.com.duotune.service;

import java.util.List;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SpotifyRoomCatalog {
    public record Track(String id, String title, String artist, String imageUrl, long durationMs) {}
    private final SpotifyOAuthService oauth;
    private final RestTemplate http;

    public SpotifyRoomCatalog(SpotifyOAuthService oauth) {
        this.oauth = oauth;
        var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(10000);
        this.http = new RestTemplate(factory);
    }

    @SuppressWarnings("rawtypes")
    private Map get(String email, String path) {
        for (int attempt = 0; attempt < 2; attempt++) {
            var headers = new HttpHeaders();
            headers.setBearerAuth((String) oauth.token(email, attempt > 0).get("access_token"));
            try {
                var result = http.exchange("https://api.spotify.com/v1/" + path, HttpMethod.GET,
                        new HttpEntity<>(headers), Map.class).getBody();
                if (result == null) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Resposta vazia do Spotify.");
                return result;
            } catch (HttpClientErrorException.Unauthorized error) {
                if (attempt == 1) throw new ResponseStatusException(HttpStatus.CONFLICT, "Reconecte o Spotify no perfil.");
            } catch (RestClientException error) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Não foi possível consultar o Spotify. Tente novamente.");
            }
        }
        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Spotify indisponível.");
    }

    public void requirePremium(String email) {
        if (!"premium".equals(get(email, "me").get("product"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "É necessário Spotify Premium para ouvir com seu Duo.");
        }
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    public Track track(String email, String id) {
        if (id == null || !id.matches("[A-Za-z0-9]{22}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Música inválida.");
        }
        Map data = get(email, "tracks/" + id);
        if (Boolean.FALSE.equals(data.get("is_playable")) || !(data.get("duration_ms") instanceof Number duration) || duration.longValue() <= 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta música não está disponível para reprodução.");
        }
        List<Map> artists = (List<Map>) data.get("artists");
        Map album = (Map) data.get("album");
        List<Map> images = album == null ? List.of() : (List<Map>) album.getOrDefault("images", List.of());
        return new Track(id, String.valueOf(data.get("name")),
                artists == null ? "" : String.join(", ", artists.stream().map(a -> String.valueOf(a.get("name"))).toList()),
                images.isEmpty() ? null : String.valueOf(images.get(0).get("url")), duration.longValue());
    }
}
