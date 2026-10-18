package br.com.duotune.controller;

import br.com.duotune.service.RoomService;
import br.com.duotune.dto.RoomDtos.*;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/v1/rooms/current")
public class RoomController {
    private final RoomService rooms;
    public RoomController(RoomService rooms) { this.rooms = rooms; }

    @GetMapping
    public RoomInfo current(Principal principal) { return rooms.current(principal.getName()); }

    @PostMapping("/messages")
    public State chat(Principal principal, @RequestBody ChatRequest request) {
        return rooms.chat(principal.getName(), request);
    }

    @PostMapping("/queue")
    public State addTrack(Principal principal, @RequestBody AddTrackRequest request) {
        return rooms.addTrack(principal.getName(), request);
    }

    @PostMapping("/queue/playlists/{playlistId}")
    public State addPlaylist(Principal principal, @PathVariable Long playlistId,
                                         @RequestBody(required = false) AddPlaylistRequest request) {
        return rooms.addPlaylist(principal.getName(), playlistId, request);
    }

    @DeleteMapping("/queue/{entryId}")
    public State removeTrack(Principal principal, @PathVariable String entryId) {
        return rooms.removeTrack(principal.getName(), entryId);
    }

    @PostMapping("/playback")
    public State playback(Principal principal, @RequestBody PlaybackRequest request) {
        return rooms.playback(principal.getName(), request);
    }

    @PostMapping("/ready")
    public State readiness(Principal principal, @RequestBody ReadyRequest request) {
        return rooms.readiness(principal.getName(), request);
    }

}