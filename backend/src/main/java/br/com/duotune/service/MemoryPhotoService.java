package br.com.duotune.service;

import br.com.duotune.dto.MemoryPhotoResponse;
import br.com.duotune.model.Duo;
import br.com.duotune.model.MemoryPhoto;
import br.com.duotune.model.User;
import br.com.duotune.repository.DuoRepository;
import br.com.duotune.repository.MemoryPhotoRepository;
import br.com.duotune.repository.UserRepository;
import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import br.com.duotune.exception.ApplicationException;
import br.com.duotune.exception.ErrorType;

@Service
public class MemoryPhotoService {
    private static final Pattern SPOTIFY_TRACK_ID = Pattern.compile("^[a-zA-Z0-9]{22}$");

    private final MemoryPhotoRepository memories;
    private final UserRepository users;
    private final DuoRepository duos;
    private final ImageProcessingService images;

    public MemoryPhotoService(MemoryPhotoRepository memories, UserRepository users,
            DuoRepository duos, ImageProcessingService images) {
        this.memories = memories;
        this.users = users;
        this.duos = duos;
        this.images = images;
    }

    @Transactional(readOnly = true)
    public List<MemoryPhotoResponse> list(String email) {
        Duo duo = activeDuo(email);
        return memories.findAllByDuoIdOrderByCreatedAtAsc(duo.getId()).stream()
                .map(this::response)
                .toList();
    }

    @Transactional
    public MemoryPhotoResponse create(String email, MultipartFile image, String trackSpotifyId,
            String trackTitle, String trackArtist, String trackImageUrl) throws IOException {
        User user = user(email);
        Duo duo = duos.findActiveDuoByUserId(user.getId())
                .orElseThrow(() -> new ApplicationException(ErrorType.CONFLICT,
                        "Forme um Duo para criar um álbum de memórias."));

        String normalizedTrackId = trackSpotifyId == null ? "" : trackSpotifyId.strip();
        String normalizedTitle = trackTitle == null ? "" : trackTitle.strip();
        String normalizedArtist = trackArtist == null ? "" : trackArtist.strip();
        String normalizedImageUrl = trackImageUrl == null || trackImageUrl.isBlank()
                ? null : trackImageUrl.strip();

        if (!SPOTIFY_TRACK_ID.matcher(normalizedTrackId).matches()) {
            throw new ApplicationException(ErrorType.INVALID_INPUT, "Selecione uma música válida do Spotify.");
        }
        if (normalizedTitle.isEmpty() || normalizedTitle.length() > 255 ||
                normalizedArtist.isEmpty() || normalizedArtist.length() > 255) {
            throw new ApplicationException(ErrorType.INVALID_INPUT, "A música selecionada não tem título ou artista válido.");
        }
        if (normalizedImageUrl != null && (normalizedImageUrl.length() > 512 || !isHttpUrl(normalizedImageUrl))) {
            throw new ApplicationException(ErrorType.INVALID_INPUT, "A capa da música tem uma URL inválida.");
        }

        MemoryPhoto memory = new MemoryPhoto();
        memory.setDuo(duo);
        memory.setCreatedBy(user);
        memory.setImageData(images.createMemoryImage(image));
        memory.setTrackSpotifyId(normalizedTrackId);
        memory.setTrackTitle(normalizedTitle);
        memory.setTrackArtist(normalizedArtist);
        memory.setTrackImageUrl(normalizedImageUrl);
        return response(memories.save(memory));
    }

    @Transactional
    public void delete(String email, Long id) {
        Duo duo = activeDuo(email);
        MemoryPhoto memory = memories.findByIdAndDuoId(id, duo.getId())
                .orElseThrow(() -> new ApplicationException(ErrorType.NOT_FOUND, "Memória não encontrada."));
        memories.delete(memory);
    }

    private Duo activeDuo(String email) {
        User user = user(email);
        return duos.findActiveDuoByUserId(user.getId())
                .orElseThrow(() -> new ApplicationException(ErrorType.CONFLICT,
                        "Forme um Duo para acessar o álbum de memórias."));
    }

    private User user(String email) {
        return users.findByEmail(email).orElseThrow(() ->
                new ApplicationException(ErrorType.UNAUTHENTICATED, "Usuário não encontrado. Entre novamente no DuoTune."));
    }

    private boolean isHttpUrl(String value) {
        try {
            String scheme = URI.create(value).getScheme();
            return "http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme);
        } catch (IllegalArgumentException error) {
            return false;
        }
    }

    private MemoryPhotoResponse response(MemoryPhoto memory) {
        return new MemoryPhotoResponse(memory.getId(), memory.getImageData(), memory.getTrackSpotifyId(),
                memory.getTrackTitle(), memory.getTrackArtist(), memory.getTrackImageUrl(),
                memory.getCreatedBy().getId(), memory.getCreatedBy().getName(), memory.getCreatedAt());
    }
}
