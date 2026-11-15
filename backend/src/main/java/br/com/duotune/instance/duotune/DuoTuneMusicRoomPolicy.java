package br.com.duotune.instance.duotune;

import br.com.duotune.framework.model.ParticipantGroup;
import br.com.duotune.framework.policy.MusicRoomPolicy;
import java.util.Set;
import java.util.stream.Collectors;

/** No DuoTune, os dois participantes têm o mesmo controle e ambos precisam estar prontos para tocar. */
public class DuoTuneMusicRoomPolicy implements MusicRoomPolicy {
    @Override
    public boolean canManageQueue(ParticipantGroup group, Long accountId) {
        return group.participants().stream()
                .anyMatch(participant -> java.util.Objects.equals(participant.accountId(), accountId));
    }

    @Override
    public boolean canStartPlayback(ParticipantGroup group, Set<Long> readyAccountIds) {
        Set<Long> participantIds = group.participants().stream()
                .map(participant -> participant.accountId())
                .collect(Collectors.toSet());
        return !participantIds.isEmpty()
                && participantIds.size() == group.participants().size()
                && readyAccountIds.containsAll(participantIds);
    }

    @Override
    public String queuePermissionDeniedMessage() {
        return "Você não tem permissão para alterar a fila desta sala.";
    }

    @Override
    public String playbackUnavailableMessage() {
        return "Os dois precisam estar na sala com seus players Spotify Premium disponíveis.";
    }
}
