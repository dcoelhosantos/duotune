package br.com.duotune.service;

import br.com.duotune.dto.PlaylistTrackResponse;
import br.com.duotune.exception.ApplicationException;
import br.com.duotune.exception.ErrorType;
import br.com.duotune.port.music.TrackCatalog;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

/** Prepara a seleção autorizada; a sala continua responsável pela capacidade e inclusão atômica. */
@Service
public class RoomPlaylistService {
    private final PlaylistService playlists;
    private final PlaylistTrackResolver resolver;

    public RoomPlaylistService(PlaylistService playlists, PlaylistTrackResolver resolver) {
        this.playlists = playlists;
        this.resolver = resolver;
    }

    public List<PlaylistTrackResponse> select(Long playlistId, String email, List<String> trackIds) {
        // Reutiliza a autorização do dono/parceiro e preserva a ordem original da playlist.
        var tracks = playlists.getPlaylistDetails(playlistId, email).tracks();
        if (trackIds != null) {
            Set<String> selected = new HashSet<>(trackIds);
            if (selected.isEmpty() || selected.contains(null) || selected.size() != trackIds.size()
                    || !tracks.stream().map(item -> item.trackSpotifyId()).toList().containsAll(selected)) {
                throw new ApplicationException(ErrorType.INVALID_INPUT, "Selecione músicas válidas desta playlist. Atualize a prévia e tente novamente.");
            }
            tracks = tracks.stream().filter(item -> selected.contains(item.trackSpotifyId())).toList();
        }
        if (tracks.isEmpty()) throw new ApplicationException(ErrorType.CONFLICT, "Esta playlist está vazia.");
        return tracks;
    }

    // Usado apenas com faixas obtidas por select, depois da autorização e da checagem de capacidade.
    public TrackCatalog.Track resolve(Long playlistId, PlaylistTrackResponse item, String email) {
        return resolver.resolve(playlistId, item, email);
    }
}
