package br.com.duotune.framework.policy;

import br.com.duotune.framework.model.ExperienceRecordType;

/** Declara quais formas de registro da experiência pertencem a uma aplicação. */
public interface ExperienceRecordingPolicy {
    boolean supports(ExperienceRecordType type);
}
