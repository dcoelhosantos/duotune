package br.com.duotune.port.music;

import br.com.duotune.dto.RecentPlay;
import br.com.duotune.model.User;
import java.util.List;

public interface ListeningHistory {
    List<RecentPlay> recent(User user);
}
