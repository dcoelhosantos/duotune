package br.com.duotune.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record PlaylistDetailsResponse(
    Long id,
    String name,
    Boolean isFusion,
    OffsetDateTime createdAt,
    List<PlaylistTrackResponse> tracks,
    String description
) {}