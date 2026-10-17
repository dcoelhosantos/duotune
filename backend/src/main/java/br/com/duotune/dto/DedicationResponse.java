package br.com.duotune.dto;

import java.time.LocalDate;

public record DedicationResponse(Long id, String trackSpotifyId, String title, String artist, String imageUrl,
        String message, LocalDate scheduleDate) {
}