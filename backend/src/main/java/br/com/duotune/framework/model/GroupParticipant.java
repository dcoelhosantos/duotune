package br.com.duotune.framework.model;

/** Participante visto pelo núcleo comum, sem depender da entidade de uma aplicação. */
public record GroupParticipant(Long accountId, String name, String profileImageUrl, ParticipantRole role) {
    // accountId pode ser nulo para convidados que entram sem criar conta.
}
