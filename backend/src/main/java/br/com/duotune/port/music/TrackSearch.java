package br.com.duotune.port.music;

import br.com.duotune.dto.TrackResponseDTO;
import java.util.List;

public interface TrackSearch {
    List<TrackResponseDTO> searchTracks(String query);
}
