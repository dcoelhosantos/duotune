package br.com.duotune.integration.spotify;

import br.com.duotune.dto.RecentPlay;
import br.com.duotune.dto.TrackResponseDTO;
import br.com.duotune.model.User;
import br.com.duotune.port.music.ListeningHistory;
import br.com.duotune.port.music.TrackCatalog;
import br.com.duotune.port.music.TrackSearch;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

/** Ponto único de acesso ao Spotify, delegando cada responsabilidade ao componente especializado. */
@Service
public class SpotifyFacade implements TrackSearch, TrackCatalog, ListeningHistory {
    private final SpotifyOAuthService oauth;
    private final SpotifyService search;
    private final SpotifyRoomCatalog catalog;
    private final SpotifyHistoryService history;

    public SpotifyFacade(SpotifyOAuthService oauth, SpotifyService search,
            SpotifyRoomCatalog catalog, SpotifyHistoryService history) {
        this.oauth = oauth;
        this.search = search;
        this.catalog = catalog;
        this.history = history;
    }

    public User user(String email) {
        return oauth.user(email);
    }

    public String authorizationUrl(String state) {
        return oauth.authorizationUrl(state);
    }

    public void connect(Long userId, String code) {
        oauth.connect(userId, code);
    }

    public void disconnect(String email) {
        oauth.disconnect(email);
    }

    public Map<String, Object> token(String email, boolean force) {
        return oauth.token(email, force);
    }

    @Override
    public List<TrackResponseDTO> searchTracks(String query) {
        return search.searchTracks(query);
    }

    @Override
    public void requirePremium(String email) {
        catalog.requirePremium(email);
    }

    @Override
    public Track track(String email, String id) {
        return catalog.track(email, id);
    }

    @Override
    public List<RecentPlay> recent(User user) {
        return history.recent(user);
    }
}
