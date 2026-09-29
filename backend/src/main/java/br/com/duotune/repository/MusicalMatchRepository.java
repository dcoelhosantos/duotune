package br.com.duotune.repository;

import br.com.duotune.model.MusicalMatch;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MusicalMatchRepository extends JpaRepository<MusicalMatch, Long> {
    List<MusicalMatch> findTop10ByDuoIdOrderByCalculatedAtDescIdDesc(Long duoId);
}
