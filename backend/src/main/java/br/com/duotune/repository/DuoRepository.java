package br.com.duotune.repository;

import java.util.Optional;

import br.com.duotune.model.Duo;
import br.com.duotune.model.enums.DuoStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DuoRepository extends JpaRepository<Duo, Long> {

    @Query("SELECT d.id FROM Duo d WHERE d.status = br.com.duotune.model.enums.DuoStatus.ACTIVE AND (d.user1.id = :userId OR d.user2.id = :userId)")
    Optional<Long> findActiveDuoId(@Param("userId") Long userId);

    @Query("""
        SELECT COUNT(d) > 0
        FROM Duo d
        WHERE d.status = :status
          AND (d.user1.id = :userId OR d.user2.id = :userId)
    """)
    boolean existsActiveDuo(
            @Param("userId") Long userId,
            @Param("status") DuoStatus status
    );

    @Query("SELECT d FROM Duo d WHERE (d.user1.id = :userId OR d.user2.id = :userId) AND d.status = 'ACTIVE'")
    Optional<Duo> findActiveDuoByUserId(@Param("userId") Long userId);
}