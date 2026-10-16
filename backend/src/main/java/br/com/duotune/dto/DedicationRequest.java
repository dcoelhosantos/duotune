package br.com.duotune.dto;

public record DedicationRequest(String trackSpotifyId, String title, String artist, String imageUrl,
        java.time.LocalDate scheduledDate) {
}