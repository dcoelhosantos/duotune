package br.com.duotune.controller;

import br.com.duotune.dto.FusionCreateRequest;
import br.com.duotune.dto.PlaylistDetailsResponse;
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

    @GetMapping("/containing-track/{trackSpotifyId}")
    public ResponseEntity<List<Long>> getPlaylistsContainingTrack(@PathVariable String trackSpotifyId,
            Principal principal) {
        List<Long> playlistIds = playlistService.getPlaylistsContainingTrack(trackSpotifyId, principal.getName());
        return ResponseEntity.ok(playlistIds);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlaylistDetailsResponse> getPlaylistDetails(@PathVariable Long id, Principal principal) {
        PlaylistDetailsResponse details = playlistService.getPlaylistDetails(id, principal.getName());
        return ResponseEntity.ok(details);
    }

    @DeleteMapping("/{id}/tracks/{trackSpotifyId}")
    public ResponseEntity<Void> removeTrackFromPlaylist(
            @PathVariable Long id,
            @PathVariable String trackSpotifyId,
            Principal principal) {

        playlistService.removeTrackFromPlaylist(id, trackSpotifyId, principal.getName());
        return ResponseEntity.noContent().build(); // Retorna 204 No Content (padrão para exclusão bem sucedida)
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlaylist(@PathVariable Long id, Principal principal) {
        playlistService.deletePlaylist(id, principal.getName());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updatePlaylist(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload,
            Principal principal) {

        playlistService.updatePlaylist(id, principal.getName(), payload.get("name"), payload.get("description"));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/fusion")
    public ResponseEntity<PlaylistDetailsResponse> createFusionPlaylist(
            @RequestBody @Valid FusionCreateRequest request,
            Principal principal) {

        PlaylistDetailsResponse response = playlistService.createFusionPlaylist(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/duo/list")
    public ResponseEntity<List<PlaylistResponse>> getDuoPlaylists(Principal principal) {
        List<PlaylistResponse> playlists = playlistService.getDuoPlaylists(principal.getName());
        return ResponseEntity.ok(playlists);
    }
}