package br.com.duotune.dto;

import java.time.OffsetDateTime;

public record PlaylistTrackResponse(
        String trackSpotifyId,
        Integer position,
        OffsetDateTime addedAt,
        String title,
        String artist,
        String imageUrl) {
}