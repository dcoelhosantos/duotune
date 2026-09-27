package br.com.duotune.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PlaylistRequest(
        @NotBlank(message = "O nome da playlist é obrigatório") @Size(max = 100, message = "O nome da playlist deve ter no máximo 100 caracteres") String name) {
}