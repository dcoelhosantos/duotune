package br.com.duotune.repository;

import java.time.OffsetDateTime;
import br.com.duotune.model.Invitation;
import br.com.duotune.model.enums.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, Long> {

    Optional<Invitation> findByCode(String code);

    boolean existsBySenderIdAndStatusAndExpiresAtAfter(
            Long senderId, InvitationStatus status, OffsetDateTime now);
    Optional<Invitation> findFirstBySenderIdAndStatusAndExpiresAtAfterOrderBySentAtDesc(
            Long senderId, InvitationStatus status, OffsetDateTime now);
}
