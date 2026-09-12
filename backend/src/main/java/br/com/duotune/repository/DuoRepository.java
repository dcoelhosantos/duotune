package br.com.duotune.repository;

import br.com.duotune.model.Duo;
import br.com.duotune.model.enums.DuoStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DuoRepository extends JpaRepository<Duo, Long> {

    @Query("""
        SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END
        FROM Duo d
        WHERE d.status = :status
          AND (d.user1.id = :usuarioId OR d.user2.id = :usuarioId)
    """)
    boolean existsActiveDuo(
            @Param("usuarioId") Long usuarioId,
            @Param("status") DuoStatus status
    );
}