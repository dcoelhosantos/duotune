package br.com.duotune.instance.duotune;

import br.com.duotune.framework.model.GroupParticipant;
import br.com.duotune.framework.model.ParticipantGroup;
import br.com.duotune.framework.model.ParticipantRole;
import br.com.duotune.framework.policy.ParticipantLinkPolicy;
import br.com.duotune.model.Duo;
import br.com.duotune.model.User;
import br.com.duotune.repository.DuoRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.transaction.annotation.Transactional;

/** Implementa o vínculo de participantes do DuoTune usando o Duo persistido atual. */
public class DuoTuneParticipantLinkPolicy implements ParticipantLinkPolicy {
    private final DuoRepository duos;

    public DuoTuneParticipantLinkPolicy(DuoRepository duos) {
        this.duos = duos;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ParticipantGroup> findActiveGroupFor(Long accountId) {
        return duos.findActiveDuoByUserId(accountId).map(this::toGroup);
    }

    @Override
    public String noActiveGroupMessage() {
        return "Forme um Duo para entrar na sala musical.";
    }

    @Override
    public String groupChangedMessage() {
        return "Seu Duo mudou. Entre novamente na sala.";
    }

    private ParticipantGroup toGroup(Duo duo) {
        return new ParticipantGroup(duo.getId(), List.of(
                participant(duo.getUser1()),
                participant(duo.getUser2())));
    }

    private GroupParticipant participant(User user) {
        return new GroupParticipant(user.getId(), user.getName(), user.getProfileImageUrl(), ParticipantRole.MEMBER);
    }
}
