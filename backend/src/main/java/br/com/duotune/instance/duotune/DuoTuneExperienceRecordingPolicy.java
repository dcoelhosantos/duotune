package br.com.duotune.instance.duotune;

import br.com.duotune.framework.model.ExperienceRecordType;
import br.com.duotune.framework.policy.ExperienceRecordingPolicy;
import java.util.EnumSet;
import java.util.Set;

/** Registros disponíveis na primeira aplicação do framework: álbum e dedicatórias. */
public class DuoTuneExperienceRecordingPolicy implements ExperienceRecordingPolicy {
    private static final Set<ExperienceRecordType> SUPPORTED_TYPES = EnumSet.of(
            ExperienceRecordType.MEMORY_ALBUM,
            ExperienceRecordType.TRACK_DEDICATION);

    @Override
    public boolean supports(ExperienceRecordType type) {
        return SUPPORTED_TYPES.contains(type);
    }
}
