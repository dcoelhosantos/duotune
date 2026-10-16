package br.com.duotune.repository;

import br.com.duotune.model.DuoDedication;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface DuoDedicationRepository extends JpaRepository<DuoDedication, Long> {
    // Busca a primeira dedicação não entregue, cuja data agendada seja hoje (ou
    // anterior a hoje), ordenada pela data
    Optional<DuoDedication> findFirstByReceiverIdAndDeliveredFalseAndScheduledDateLessThanEqualOrderByScheduledDateAsc(
            Long receiverId, LocalDate date);
}