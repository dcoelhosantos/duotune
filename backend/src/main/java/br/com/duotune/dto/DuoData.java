package br.com.duotune.dto;

import br.com.duotune.model.enums.DuoStatus;
import java.time.OffsetDateTime;
import java.util.List;

public record DuoData(
        Long id,
        DuoStatus status,
        OffsetDateTime formedAt,
        List<UserResponse> members
) {
}