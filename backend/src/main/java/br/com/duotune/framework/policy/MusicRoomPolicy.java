package br.com.duotune.framework.policy;

import br.com.duotune.framework.model.ParticipantGroup;
import java.util.Set;

/** Regras variáveis de controle da fila e de reprodução de uma sala. */
public interface MusicRoomPolicy {
    boolean canManageQueue(ParticipantGroup group, Long accountId);

    boolean canStartPlayback(ParticipantGroup group, Set<Long> readyAccountIds);

    String queuePermissionDeniedMessage();

    String playbackUnavailableMessage();
}
