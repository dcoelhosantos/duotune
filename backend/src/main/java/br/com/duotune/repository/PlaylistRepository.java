package br.com.duotune.repository;

import br.com.duotune.model.Playlist;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlaylistRepository extends JpaRepository<Playlist, Long> {
    List<Playlist> findAllByUserIdOrderByCreatedAtDesc(Long userId);
}