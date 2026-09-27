package br.com.duotune.controller;

import br.com.duotune.dto.PlaylistRequest;
import br.com.duotune.dto.PlaylistResponse;
import br.com.duotune.dto.TrackAddRequest;
import br.com.duotune.service.PlaylistService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/playlists")
public class PlaylistController {

    private final PlaylistService playlistService;

    public PlaylistController(PlaylistService playlistService) {
        this.playlistService = playlistService;
    }

    @PostMapping
    public ResponseEntity<PlaylistResponse> createPlaylist(@Valid @RequestBody PlaylistRequest request,
            Principal principal) {
        PlaylistResponse response = playlistService.createPlaylist(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<PlaylistResponse>> getUserPlaylists(Principal principal) {
        List<PlaylistResponse> playlists = playlistService.getUserPlaylists(principal.getName());
        return ResponseEntity.ok(playlists);
    }

    @PostMapping("/{id}/tracks")
    public ResponseEntity<Void> addTrackToPlaylist(@PathVariable Long id, @Valid @RequestBody TrackAddRequest request,
            Principal principal) {
        playlistService.addTrackToPlaylist(id, request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}