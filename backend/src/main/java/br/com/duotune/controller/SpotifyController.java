package br.com.duotune.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.duotune.dto.TrackResponseDTO;
import br.com.duotune.integration.spotify.SpotifyFacade;

@RestController
@RequestMapping("/api/spotify")
public class SpotifyController {

    private final SpotifyFacade spotifyService;

    public SpotifyController(SpotifyFacade spotifyService) {
        this.spotifyService = spotifyService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<TrackResponseDTO>> search(@RequestParam String q) {
        return ResponseEntity.ok(spotifyService.searchTracks(q));
    }
}
