package br.com.duotune.controller;

import br.com.duotune.exception.dto.ErrorResponse;
import br.com.duotune.service.RoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.security.Principal;

@RestController
@RequestMapping("/api/v1/rooms/current")
public class RoomController {
    private final RoomService rooms;
    public RoomController(RoomService rooms) { this.rooms = rooms; }

    @GetMapping
    public RoomService.RoomInfo current(Principal principal) { return rooms.current(principal.getName()); }

    @PostMapping("/messages")
    public RoomService.State chat(Principal principal, @RequestBody RoomService.ChatRequest request) {
        return rooms.chat(principal.getName(), request);
    }

    @PostMapping("/queue")
    public RoomService.State addTrack(Principal principal, @RequestBody RoomService.AddTrackRequest request) {
        return rooms.addTrack(principal.getName(), request);
    }

    @PostMapping("/queue/playlists/{playlistId}")
    public RoomService.State addPlaylist(Principal principal, @PathVariable Long playlistId,
                                         @RequestBody(required = false) RoomService.AddPlaylistRequest request) {
        return rooms.addPlaylist(principal.getName(), playlistId, request);
    }

    @ExceptionHandler(br.com.duotune.exception.BusinessException.class)
    public ResponseEntity<ErrorResponse> playlistError(br.com.duotune.exception.BusinessException error) {
        int status = "UNAUTHORIZED_ACTION".equals(error.getCode()) ? 403
                : "PLAYLIST_NOT_FOUND".equals(error.getCode()) ? 404 : 400;
        return ResponseEntity.status(status).body(new ErrorResponse(error.getCode(), error.getMessage()));
    }

    @DeleteMapping("/queue/{entryId}")
    public RoomService.State removeTrack(Principal principal, @PathVariable String entryId) {
        return rooms.removeTrack(principal.getName(), entryId);
    }

    @PostMapping("/playback")
    public RoomService.State playback(Principal principal, @RequestBody RoomService.PlaybackRequest request) {
        return rooms.playback(principal.getName(), request);
    }

    @PostMapping("/ready")
    public RoomService.State readiness(Principal principal, @RequestBody RoomService.ReadyRequest request) {
        return rooms.readiness(principal.getName(), request);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> error(ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).body(new ErrorResponse("ROOM_REQUEST_FAILED", error.getReason()));
    }
}