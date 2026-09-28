package br.com.duotune.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record FusionCreateRequest(
        @NotBlank(message = "O nome da playlist Fusion é obrigatório")
        String name,

        @Min(value = 1, message = "O padrão mínimo é 1x1")
        @Max(value = 5, message = "O padrão máximo é 5x5")
        Integer pattern, // Recebe 1, 2, 3, 4 ou 5
        
        @NotEmpty(message = "A lista do usuário 1 não pode estar vazia")
        List<@Valid TrackAddRequest> tracksUser1,

        @NotEmpty(message = "A lista do usuário 2 não pode estar vazia")
        List<@Valid TrackAddRequest> tracksUser2
) {}