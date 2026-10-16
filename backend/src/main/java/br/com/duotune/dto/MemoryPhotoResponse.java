package br.com.duotune.dto;

import java.time.OffsetDateTime;

public record MemoryPhotoResponse(
        Long id,
        String imageData,
        String trackSpotifyId,
        String trackTitle,
        String trackArtist,
        String trackImageUrl,
        Long createdByUserId,
        String createdByName,
        OffsetDateTime createdAt) {}
