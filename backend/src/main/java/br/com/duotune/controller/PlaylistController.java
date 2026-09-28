package br.com.duotune.controller;

import br.com.duotune.dto.PlaylistDetailsResponse;
import br.com.duotune.dto.PlaylistRequest;
import br.com.duotune.dto.PlaylistResponse;
import br.com.duotune.dto.TrackAddRequest;
import br.com.duotune.exception.BusinessException;
import br.com.duotune.exception.dto.ErrorResponse;
import br.com.duotune.service.PlaylistService;
import jakarta.validation.Valid;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
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

    // --- TRATAMENTO DE EXCEÇÕES PADRONIZADO --- //

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> businessError(BusinessException error) {
        HttpStatus status = switch (error.getCode()) {
            case "PLAYLIST_NOT_FOUND", "USER_NOT_FOUND" -> HttpStatus.NOT_FOUND;
            case "UNAUTHORIZED_ACTION" -> HttpStatus.FORBIDDEN;
            case "TRACK_ALREADY_EXISTS" -> HttpStatus.CONFLICT;
            default -> HttpStatus.BAD_REQUEST;
        };
        return ResponseEntity.status(status).body(new ErrorResponse(error.getCode(), error.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> dataIntegrityError(DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse("TRACK_ALREADY_EXISTS", "Esta música já está na playlist."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> invalidRequest(MethodArgumentNotValidException error) {
        var field = error.getBindingResult().getFieldError();
        return ResponseEntity.badRequest().body(new ErrorResponse("INVALID_DATA",
                field == null ? "Dados inválidos." : field.getDefaultMessage()));
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
}