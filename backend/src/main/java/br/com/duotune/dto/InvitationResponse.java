package br.com.duotune.dto;

public record InvitationResponse(
        InvitationData invitation,
        RecipientData recipient
) {
}