package br.com.duotune.repository;

import br.com.duotune.model.TrackMetadata;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrackMetadataRepository extends JpaRepository<TrackMetadata, String> {}
