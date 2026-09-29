package br.com.duotune.dto;

import java.time.OffsetDateTime;

import br.com.duotune.model.Playlist;

public record PlaylistResponse(Long id, String name, Boolean isFusion, OffsetDateTime createdAt, String coverImageUrl) {

    public static PlaylistResponse fromEntity(Playlist p) {
        return fromEntity(p, null);
    }

    public static PlaylistResponse fromEntity(Playlist p, String coverImageUrl) {
        return new PlaylistResponse(p.getId(), p.getName(), p.getIsFusion(), p.getCreatedAt(), coverImageUrl);
    }
}