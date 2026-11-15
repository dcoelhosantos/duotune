package br.com.duotune.framework.model;

import java.util.List;

/** Grupo ativo que compartilha uma sala musical. */
public record ParticipantGroup(Long id, List<GroupParticipant> participants) {
    public ParticipantGroup {
        participants = List.copyOf(participants);
    }
}
