package br.com.duotune.repository;

import br.com.duotune.model.MemoryPhoto;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemoryPhotoRepository extends JpaRepository<MemoryPhoto, Long> {
    List<MemoryPhoto> findAllByDuoIdOrderByCreatedAtAsc(Long duoId);
    Optional<MemoryPhoto> findByIdAndDuoId(Long id, Long duoId);
}
