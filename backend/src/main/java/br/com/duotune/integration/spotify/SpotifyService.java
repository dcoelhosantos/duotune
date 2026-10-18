package br.com.duotune.integration.spotify;

import br.com.duotune.model.TrackMetadata;
import br.com.duotune.repository.TrackMetadataRepository;
import br.com.duotune.exception.ApplicationException;
import br.com.duotune.exception.ErrorType;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;

import br.com.duotune.dto.TrackResponseDTO;

@Service
public class SpotifyService {
    private static final long TOKEN_REFRESH_SKEW_SECONDS = 60;
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(SpotifyService.class);
    private final TrackMetadataRepository metadata;
    private final String clientId;
    private final String clientSecret;
    private final RestTemplate restTemplate;
    private String cachedAccessToken;
    private Instant tokenExpiresAt = Instant.EPOCH;

    @Autowired
    public SpotifyService(TrackMetadataRepository metadata,
            @Value("${spotify.client.id}") String clientId,
            @Value("${spotify.client.secret}") String clientSecret) {
        this(metadata, clientId, clientSecret, createHttpClient());
    }

    SpotifyService(TrackMetadataRepository metadata, String clientId, String clientSecret, RestTemplate restTemplate) {
        this.metadata = metadata;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.restTemplate = restTemplate;
    }

    private static RestTemplate createHttpClient() {
        var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(15000);
        return new RestTemplate(factory);
    }

    @SuppressWarnings("rawtypes")
    private synchronized String getAccessToken() {
        if (cachedAccessToken != null
                && tokenExpiresAt.isAfter(Instant.now().plusSeconds(TOKEN_REFRESH_SKEW_SECONDS))) {
            return cachedAccessToken;
        }

        String url = "https://accounts.spotify.com/api/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBasicAuth(clientId, clientSecret); 

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(form, headers);
        
        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
        Map<?, ?> tokenResponse = response == null ? null : response.getBody();
        if (tokenResponse == null || !(tokenResponse.get("access_token") instanceof String accessToken)
                || accessToken.isBlank() || !(tokenResponse.get("expires_in") instanceof Number expiresIn)
                || expiresIn.longValue() <= 0) {
            throw invalidSpotifyResponse();
        }

        cachedAccessToken = accessToken;
        tokenExpiresAt = Instant.now().plusSeconds(expiresIn.longValue());
        return cachedAccessToken;
    }

    public List<TrackResponseDTO> searchTracks(String query) {
        try {
            return fetchTracks(query);
        } catch (HttpClientErrorException.TooManyRequests error) {
            throw new ApplicationException(ErrorType.RATE_LIMITED,
                    "O Spotify recebeu muitas solicitações. Aguarde um pouco e tente novamente.");
        } catch (RestClientException error) {
            throw new ApplicationException(ErrorType.INTEGRATION_FAILURE,
                    "Não foi possível consultar o Spotify. Tente novamente em instantes.");
        }
    }

    @SuppressWarnings("rawtypes")
    private List<TrackResponseDTO> fetchTracks(String query) {
        String token = getAccessToken();
        java.net.URI url = org.springframework.web.util.UriComponentsBuilder
            .fromUriString("https://api.spotify.com/v1/search")
            .queryParam("type", "track").queryParam("limit", 10).queryParam("q", "{query}")
            .encode().buildAndExpand(query).toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token); 

        HttpEntity<Void> request = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);

        Map<?, ?> body = response == null ? null : response.getBody();
        Map<?, ?> tracksNode = body == null ? null : asMap(body.get("tracks"));
        Object itemsValue = tracksNode == null ? null : tracksNode.get("items");
        if (!(itemsValue instanceof List<?> items)) {
            throw invalidSpotifyResponse();
        }

        List<TrackResponseDTO> tracks = new ArrayList<>();

        var durations = new ArrayList<TrackMetadata>();
        for (Object itemValue : items) {
            Map<?, ?> item = asMap(itemValue);
            String id = requiredString(item, "id");
            String title = requiredString(item, "name");

            String artist = "Desconhecido";
            Object artistsValue = item.get("artists");
            if (artistsValue != null) {
                if (!(artistsValue instanceof List<?> artists)) {
                    throw invalidSpotifyResponse();
                }
                if (!artists.isEmpty()) {
                    Map<?, ?> firstArtist = asMap(artists.get(0));
                    Object artistName = firstArtist.get("name");
                    if (artistName instanceof String name && !name.isBlank()) artist = name;
                }
            }

            String imageUrl = null;
            Object albumValue = item.get("album");
            if (albumValue != null) {
                Map<?, ?> album = asMap(albumValue);
                Object imagesValue = album.get("images");
                if (imagesValue != null && !(imagesValue instanceof List<?>)) {
                    throw invalidSpotifyResponse();
                }
                if (imagesValue instanceof List<?> images) {
                    if (!images.isEmpty()) {
                        Object imageUrlValue = asMap(images.get(0)).get("url");
                        if (imageUrlValue instanceof String urlValue && !urlValue.isBlank()) imageUrl = urlValue;
                    }
                }
            }

            Object previewObj = item.get("preview_url");
            if (previewObj != null && !(previewObj instanceof String)) {
                throw invalidSpotifyResponse();
            }

            String previewUrl = (previewObj != null) 
                ? previewObj.toString() 
                : null;

            Object playableValue = item.get("is_playable");
            if (playableValue != null && !(playableValue instanceof Boolean)) {
                throw invalidSpotifyResponse();
            }
            if (item.get("duration_ms") != null && !(item.get("duration_ms") instanceof Number)) {
                throw invalidSpotifyResponse();
            }
            if (!Boolean.FALSE.equals(playableValue)
                    && item.get("duration_ms") instanceof Number duration && duration.longValue() > 0) {
                durations.add(new TrackMetadata(id, duration.longValue()));
            }
            tracks.add(new TrackResponseDTO(id, title, artist, imageUrl, previewUrl));
        }

        try {
            metadata.saveAll(durations);
        } catch (org.springframework.dao.DataAccessException error) {
            // A persistência é uma otimização: não deve impedir a entrega da busca.
            logger.warn("Não foi possível guardar as durações da busca do Spotify.", error);
        }
        return tracks;
    }

    private static Map<?, ?> asMap(Object value) {
        if (value instanceof Map<?, ?> map) return map;
        throw invalidSpotifyResponse();
    }

    private static String requiredString(Map<?, ?> value, String key) {
        Object field = value.get(key);
        if (field instanceof String text && !text.isBlank()) return text;
        throw invalidSpotifyResponse();
    }

    private static ApplicationException invalidSpotifyResponse() {
        return new ApplicationException(ErrorType.INTEGRATION_FAILURE,
                "O Spotify retornou uma resposta inválida. Tente novamente em instantes.");
    }
}
