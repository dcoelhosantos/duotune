package br.com.duotune.service;

import br.com.duotune.dto.PlaylistTrackResponse;
import br.com.duotune.model.TrackMetadata;
import br.com.duotune.port.music.TrackCatalog;
import br.com.duotune.repository.TrackMetadataRepository;
import br.com.duotune.repository.PlaylistTrackRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlaylistTrackResolver {
    private final TrackCatalog catalog;
    private final TrackMetadataRepository metadata;
    private final PlaylistTrackRepository playlistTrackRepository;

    public PlaylistTrackResolver(TrackCatalog catalog, TrackMetadataRepository metadata, PlaylistTrackRepository playlistTrackRepository) {
        this.catalog = catalog;
        this.metadata = metadata;
        this.playlistTrackRepository = playlistTrackRepository;
    }

    private Long savedDuration(String id) {
        return metadata.findById(id).map(TrackMetadata::getDurationMs)
                .filter(duration -> duration > 0).orElse(null);
    }

    // Chamado somente depois de autorizar a playlist em getPlaylistDetails.
    @Transactional
    public TrackCatalog.Track resolve(Long playlistId, PlaylistTrackResponse item, String email) {
        if (item.durationMs() != null && item.durationMs() > 0
                && item.title() != null && !item.title().isBlank()
                && item.artist() != null && !item.artist().isBlank()) {
            return new TrackCatalog.Track(item.trackSpotifyId(), item.title(), item.artist(), item.imageUrl(), item.durationMs());
        }
        Long duration = item.durationMs();
        if (duration == null || duration <= 0) duration = savedDuration(item.trackSpotifyId());
        TrackCatalog.Track result;
        if (duration != null && duration > 0 && item.title() != null && !item.title().isBlank()
                && item.artist() != null && !item.artist().isBlank()) {
            result = new TrackCatalog.Track(item.trackSpotifyId(), item.title(), item.artist(), item.imageUrl(), duration);
        } else {
            result = catalog.track(email, item.trackSpotifyId());
            metadata.save(new TrackMetadata(result.id(), result.durationMs()));
        }
        playlistTrackRepository.findByPlaylistIdAndTrackSpotifyId(playlistId, item.trackSpotifyId()).ifPresent(track -> {
            track.setDurationMs(result.durationMs());
            track.setTitle(result.title());
            track.setArtist(result.artist());
            track.setImageUrl(result.imageUrl());
        });
        return result;
    }

}
