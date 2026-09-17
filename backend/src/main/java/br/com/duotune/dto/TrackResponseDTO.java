package br.com.duotune.dto;

public record TrackResponseDTO(
    String id,
    String title,
    String artist,
    String imageUrl,
    String previewUrl
) {}