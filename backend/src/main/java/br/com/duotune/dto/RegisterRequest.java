package br.com.duotune.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RegisterRequest(
        @NotBlank(message = "Informe seu nome.") String name,
        @NotBlank(message = "Informe seu e-mail.") @Email(message = "Informe um e-mail válido.") String email,
        @NotBlank(message = "Informe sua senha.") String password) {
}
