package br.com.duotune.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record TrackAddRequest(
        @NotBlank(message = "O ID da faixa do Spotify é obrigatório") @Size(min = 22, max = 22, message = "O ID da faixa do Spotify deve conter exatamente 22 caracteres") @Pattern(regexp = "^[a-zA-Z0-9]{22}$", message = "O ID da faixa do Spotify tem um formato inválido") String trackSpotifyId) {
}