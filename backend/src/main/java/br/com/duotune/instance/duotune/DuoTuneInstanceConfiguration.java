package br.com.duotune.instance.duotune;

import br.com.duotune.framework.policy.ExperienceRecordingPolicy;
import br.com.duotune.framework.policy.MusicRoomPolicy;
import br.com.duotune.framework.policy.ParticipantLinkPolicy;
import br.com.duotune.repository.DuoRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Seleciona as regras concretas que instanciam o framework como DuoTune. */
@Configuration
@ConditionalOnProperty(name = "framework.instance", havingValue = "duotune", matchIfMissing = true)
public class DuoTuneInstanceConfiguration {
    @Bean
    public ParticipantLinkPolicy participantLinkPolicy(DuoRepository duos) {
        return new DuoTuneParticipantLinkPolicy(duos);
    }

    @Bean
    public MusicRoomPolicy musicRoomPolicy() {
        return new DuoTuneMusicRoomPolicy();
    }

    @Bean
    public ExperienceRecordingPolicy experienceRecordingPolicy() {
        return new DuoTuneExperienceRecordingPolicy();
    }
}
