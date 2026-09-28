package br.com.duotune.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record TrackAddRequest(
                @NotBlank(message = "O ID da faixa do Spotify é obrigatório") @Size(min = 22, max = 22, message = "O ID da faixa do Spotify deve conter exatamente 22 caracteres") @Pattern(regexp = "^[a-zA-Z0-9]{22}$", message = "O ID da faixa do Spotify tem um formato inválido") String trackSpotifyId,

                @NotBlank(message = "O título é obrigatório") @Size(max = 255, message = "O título não pode ultrapassar 255 caracteres") String title,

                @NotBlank(message = "O artista é obrigatório") @Size(max = 255, message = "O artista não pode ultrapassar 255 caracteres") String artist,

                @Size(max = 512, message = "A URL da imagem não pode ultrapassar 512 caracteres") @Pattern(regexp = "^(http|https)://.*", message = "Formato de URL inválido para a capa da música") String imageUrl) {
}