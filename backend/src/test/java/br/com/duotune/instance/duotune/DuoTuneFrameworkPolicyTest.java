package br.com.duotune.instance.duotune;

import br.com.duotune.framework.model.ExperienceRecordType;
import br.com.duotune.framework.model.GroupParticipant;
import br.com.duotune.framework.model.ParticipantGroup;
import br.com.duotune.framework.model.ParticipantRole;
import br.com.duotune.model.Duo;
import br.com.duotune.model.User;
import br.com.duotune.model.enums.DuoStatus;
import br.com.duotune.repository.DuoRepository;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DuoTuneFrameworkPolicyTest {
    @Test
    void participantPolicyAdaptsAnActiveDuoToTheFrameworkGroup() {
        DuoRepository duos = mock(DuoRepository.class);
        User first = user(1L, "Ana");
        User second = user(2L, "Bia");
        Duo duo = new Duo();
        duo.setId(10L);
        duo.setUser1(first);
        duo.setUser2(second);
        duo.setStatus(DuoStatus.ACTIVE);
        when(duos.findActiveDuoByUserId(1L)).thenReturn(Optional.of(duo));

        var group = new DuoTuneParticipantLinkPolicy(duos).findActiveGroupFor(1L).orElseThrow();

        assertEquals(10L, group.id());
        assertEquals(List.of(1L, 2L), group.participants().stream().map(GroupParticipant::accountId).toList());
        assertTrue(group.participants().stream().allMatch(member -> member.role() == ParticipantRole.MEMBER));
    }

    @Test
    void roomPolicyKeepsSharedControlAndRequiresBothParticipantsToBeReady() {
        ParticipantGroup group = new ParticipantGroup(10L, List.of(
                participant(1L), participant(2L)));
        var policy = new DuoTuneMusicRoomPolicy();

        assertTrue(policy.canManageQueue(group, 1L));
        assertTrue(policy.canManageQueue(group, 2L));
        assertFalse(policy.canManageQueue(group, 3L));
        assertFalse(policy.canStartPlayback(group, Set.of(1L)));
        assertTrue(policy.canStartPlayback(group, Set.of(1L, 2L)));
    }

    @Test
    void experiencePolicyEnablesOnlyDuoTuneRecords() {
        var policy = new DuoTuneExperienceRecordingPolicy();

        assertTrue(policy.supports(ExperienceRecordType.MEMORY_ALBUM));
        assertTrue(policy.supports(ExperienceRecordType.TRACK_DEDICATION));
        assertFalse(policy.supports(ExperienceRecordType.PHOTO_CONVERSATION));
        assertFalse(policy.supports(ExperienceRecordType.FINAL_QUEUE_PLAYLIST));
    }

    private static User user(Long id, String name) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        user.setProfileImageUrl("/" + name.toLowerCase());
        return user;
    }

    private static GroupParticipant participant(Long id) {
        return new GroupParticipant(id, "Member " + id, null, ParticipantRole.MEMBER);
    }
}
