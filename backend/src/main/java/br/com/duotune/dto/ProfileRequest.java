package br.com.duotune.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfileRequest(
        @NotBlank(message = "Informe um nome de até 100 caracteres.")
        @Size(max = 100, message = "Informe um nome de até 100 caracteres.")
        String name
) {
}
