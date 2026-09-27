package br.com.duotune.repository;

import br.com.duotune.model.PlaylistTrack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlaylistTrackRepository extends JpaRepository<PlaylistTrack, Long> {
    boolean existsByPlaylistIdAndTrackSpotifyId(Long playlistId, String trackSpotifyId);

    @Query("SELECT COALESCE(MAX(pt.position), 0) FROM PlaylistTrack pt WHERE pt.playlist.id = :playlistId")
    int findMaxPositionByPlaylistId(@Param("playlistId") Long playlistId);
}