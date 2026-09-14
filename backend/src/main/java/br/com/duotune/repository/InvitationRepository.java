package br.com.duotune.repository;

import br.com.duotune.model.Invitation;
import br.com.duotune.model.enums.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, Long> {

    Optional<Invitation> findByCode(String code);

    boolean existsBySenderIdAndRecipientIdAndStatus(
            Long senderId,
            Long recipientId,
            InvitationStatus status
    );
}