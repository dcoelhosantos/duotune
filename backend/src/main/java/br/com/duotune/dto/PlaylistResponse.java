package br.com.duotune.dto;

import java.time.OffsetDateTime;

import br.com.duotune.model.Playlist;

public record PlaylistResponse(Long id, String name, Boolean isFusion, OffsetDateTime createdAt) {

    public static PlaylistResponse fromEntity(Playlist p) {
        return new PlaylistResponse(p.getId(), p.getName(), p.getIsFusion(), p.getCreatedAt());
    }
}