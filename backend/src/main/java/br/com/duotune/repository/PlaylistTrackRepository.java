package br.com.duotune.repository;

import br.com.duotune.model.PlaylistTrack;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaylistTrackRepository extends JpaRepository<PlaylistTrack, Long> {
    boolean existsByPlaylistIdAndTrackSpotifyId(Long playlistId, String trackSpotifyId);

    int countByPlaylistId(Long playlistId);
}