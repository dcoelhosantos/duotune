package br.com.duotune.dto;

import jakarta.validation.constraints.NotBlank;

public record TrackAddRequest(@NotBlank(message = "O ID da faixa do Spotify é obrigatório") String trackSpotifyId) {
}