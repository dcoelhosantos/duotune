package br.com.duotune.dto;

import br.com.duotune.model.enums.InvitationStatus;
import java.time.OffsetDateTime;

public record InvitationData(
        Long id,
        String code,
        InvitationStatus status,
        OffsetDateTime expiresAt
) {
}