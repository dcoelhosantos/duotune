package br.com.duotune.integration.spotify;

import br.com.duotune.port.music.TrackCatalog;
import br.com.duotune.exception.ApplicationException;
import br.com.duotune.exception.ErrorType;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Service
public class SpotifyRoomCatalog {
    private final SpotifyOAuthService oauth;
    private final RestTemplate http;

    @Autowired
    public SpotifyRoomCatalog(SpotifyOAuthService oauth) {
        this(oauth, createHttpClient());
    }

    SpotifyRoomCatalog(SpotifyOAuthService oauth, RestTemplate http) {
        this.oauth = oauth;
        this.http = http;
    }

    private static RestTemplate createHttpClient() {
        var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(10000);
        return new RestTemplate(factory);
    }

    @SuppressWarnings("rawtypes")
    private Map get(String email, String path) {
        for (int attempt = 0; attempt < 2; attempt++) {
            var headers = new HttpHeaders();
            headers.setBearerAuth((String) oauth.token(email, attempt > 0).get("access_token"));
            try {
                var result = http.exchange("https://api.spotify.com/v1/" + path, HttpMethod.GET,
                        new HttpEntity<>(headers), Map.class).getBody();
                if (result == null) throw new ApplicationException(ErrorType.INTEGRATION_FAILURE, "Resposta vazia do Spotify.");
                return result;
            } catch (HttpClientErrorException.Unauthorized error) {
                if (attempt == 1) throw new ApplicationException(ErrorType.CONFLICT, "Reconecte o Spotify no perfil.");
            } catch (HttpClientErrorException.TooManyRequests error) {
                throw new ApplicationException(ErrorType.RATE_LIMITED,
                        "O Spotify recebeu muitas solicitações. Aguarde um pouco e tente novamente.");
            } catch (RestClientException error) {
                throw new ApplicationException(ErrorType.INTEGRATION_FAILURE, "Não foi possível consultar o Spotify. Tente novamente.");
            }
        }
        throw new ApplicationException(ErrorType.INTEGRATION_FAILURE, "Spotify indisponível.");
    }

    public void requirePremium(String email) {
        if (!"premium".equals(get(email, "me").get("product"))) {
            throw new ApplicationException(ErrorType.CONFLICT, "É necessário Spotify Premium para ouvir com seu Duo.");
        }
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    public TrackCatalog.Track track(String email, String id) {
        if (id == null || !id.matches("[A-Za-z0-9]{22}")) {
            throw new ApplicationException(ErrorType.INVALID_INPUT, "Música inválida.");
        }
        Map data = get(email, "tracks/" + id);
        if (Boolean.FALSE.equals(data.get("is_playable")) || !(data.get("duration_ms") instanceof Number duration) || duration.longValue() <= 0) {
            throw new ApplicationException(ErrorType.CONFLICT, "Esta música não está disponível para reprodução.");
        }
        List<Map> artists = (List<Map>) data.get("artists");
        Map album = (Map) data.get("album");
        List<Map> images = album == null ? List.of() : (List<Map>) album.getOrDefault("images", List.of());
        return new TrackCatalog.Track(id, String.valueOf(data.get("name")),
                artists == null ? "" : String.join(", ", artists.stream().map(a -> String.valueOf(a.get("name"))).toList()),
                images.isEmpty() ? null : String.valueOf(images.get(0).get("url")), duration.longValue());
    }
}
