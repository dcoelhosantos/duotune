package br.com.duotune.controller;

import br.com.duotune.dto.MemoryPhotoResponse;
import br.com.duotune.service.MemoryPhotoService;
import java.io.IOException;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/memories")
public class MemoryPhotoController {
    private final MemoryPhotoService memories;

    public MemoryPhotoController(MemoryPhotoService memories) {
        this.memories = memories;
    }

    @GetMapping
    public List<MemoryPhotoResponse> list(Principal principal) {
        return memories.list(principal.getName());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MemoryPhotoResponse> create(Principal principal,
            @RequestParam("image") MultipartFile image,
            @RequestParam("trackSpotifyId") String trackSpotifyId,
            @RequestParam("trackTitle") String trackTitle,
            @RequestParam("trackArtist") String trackArtist,
            @RequestParam(value = "trackImageUrl", required = false) String trackImageUrl) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED).body(memories.create(principal.getName(), image,
                trackSpotifyId, trackTitle, trackArtist, trackImageUrl));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Principal principal, @PathVariable Long id) {
        memories.delete(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }

}
