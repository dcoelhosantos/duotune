package br.com.duotune.framework.policy;

import br.com.duotune.framework.model.ParticipantGroup;
import java.util.Optional;

/** Fornece o grupo ativo ao qual uma conta pertence nesta aplicação. */
public interface ParticipantLinkPolicy {
    Optional<ParticipantGroup> findActiveGroupFor(Long accountId);

    String noActiveGroupMessage();

    String groupChangedMessage();
}
