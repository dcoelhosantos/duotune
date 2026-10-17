package br.com.duotune.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record DedicationRequest(
                @NotBlank String trackSpotifyId,
                @NotBlank String title,
                @NotBlank String artist,
                String imageUrl,
                @NotNull @Future LocalDate scheduledDate) {
}