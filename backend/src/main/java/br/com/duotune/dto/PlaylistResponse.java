package br.com.duotune.dto;

import java.time.OffsetDateTime;

public record PlaylistResponse(Long id, String name, Boolean isFusion, OffsetDateTime createdAt) {
}