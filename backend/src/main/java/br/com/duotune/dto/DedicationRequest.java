package br.com.duotune.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record DedicationRequest(
                @NotBlank @Pattern(regexp = "^[a-zA-Z0-9]{22}$", message = "ID do Spotify inválido") String trackSpotifyId,

                @NotBlank @Size(max = 255) String title,

                @NotBlank @Size(max = 255) String artist,

                @Size(max = 2048) String imageUrl,

                @Size(max = 255) String message,

                @NotNull LocalDate scheduledDate) {
}