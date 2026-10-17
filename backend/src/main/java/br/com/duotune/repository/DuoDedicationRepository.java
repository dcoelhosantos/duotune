package br.com.duotune.repository;

import br.com.duotune.model.DuoDedication;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DuoDedicationRepository extends JpaRepository<DuoDedication, Long> {
    // Busca a primeira dedicação não entregue, cuja data agendada seja hoje (ou
    // anterior a hoje), ordenada pela data
    Optional<DuoDedication> findFirstByReceiverIdAndSenderIdAndDeliveredFalseAndScheduledDateLessThanEqualOrderByScheduledDateAsc(
            Long receiverId, Long senderId, LocalDate scheduledDate);

    boolean existsByReceiverIdAndScheduledDate(Long receiverId, LocalDate scheduledDate);

    List<DuoDedication> findBySenderIdOrderByScheduledDateDesc(Long senderId);

    List<DuoDedication> findByReceiverIdAndScheduledDateLessThanEqualOrderByScheduledDateDesc(Long receiverId,
            LocalDate date);
}