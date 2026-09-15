package br.com.duotune.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import br.com.duotune.dto.TrackResponseDTO;

@Service
public class SpotifyService {

    @Value("${spotify.client.id}")
    private String clientId;

    @Value("${spotify.client.secret}")
    private String clientSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    @SuppressWarnings("rawtypes")
    private String getAccessToken() {
        String url = "https://accounts.spotify.com/api/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBasicAuth(clientId, clientSecret); 

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
        
        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
        return response.getBody().get("access_token").toString();
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    public List<TrackResponseDTO> searchTracks(String query) {
        String token = getAccessToken();
        String url = "https://api.spotify.com/v1/search?type=track&limit=5&q=" + query; 

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token); 

        HttpEntity<Void> request = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);

        List<TrackResponseDTO> tracks = new ArrayList<>();
        Map<String, Object> body = response.getBody();
        Map<String, Object> tracksNode = (Map<String, Object>) body.get("tracks");
        List<Map<String, Object>> items = (List<Map<String, Object>>) tracksNode.get("items");

        for (Map<String, Object> item : items) {
            String id = item.get("id").toString();
            String title = item.get("name").toString();
            
            List<Map<String, Object>> artists = (List<Map<String, Object>>) item.get("artists");
            String artist = artists.get(0).get("name").toString(); 
            
            tracks.add(new TrackResponseDTO(id, title, artist));
        }

        return tracks;
    }
}