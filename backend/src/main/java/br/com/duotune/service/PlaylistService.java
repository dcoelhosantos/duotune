package br.com.duotune.service;

import br.com.duotune.dto.PlaylistDetailsResponse;
import br.com.duotune.dto.PlaylistRequest;
import br.com.duotune.dto.PlaylistResponse;
import br.com.duotune.dto.PlaylistTrackResponse;
import br.com.duotune.dto.TrackAddRequest;
import br.com.duotune.exception.BusinessException;
import br.com.duotune.model.Playlist;
import br.com.duotune.model.PlaylistTrack;
import br.com.duotune.model.User;
import br.com.duotune.repository.PlaylistRepository;
import br.com.duotune.repository.PlaylistTrackRepository;
import br.com.duotune.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final PlaylistTrackRepository playlistTrackRepository;
    private final UserRepository userRepository;

    public PlaylistService(PlaylistRepository playlistRepository, PlaylistTrackRepository playlistTrackRepository,
            UserRepository userRepository) {
        this.playlistRepository = playlistRepository;
        this.playlistTrackRepository = playlistTrackRepository;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Usuário não encontrado."));
    }

    @Transactional
    public PlaylistResponse createPlaylist(PlaylistRequest request, String email) {
        User user = getAuthenticatedUser(email);

        Playlist playlist = new Playlist();
        playlist.setUser(user);
        playlist.setName(request.name() != null ? request.name().trim() : "Playlist Sem Nome");
        playlist.setIsFusion(false);

        Playlist saved = playlistRepository.save(playlist);

        return PlaylistResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<PlaylistResponse> getUserPlaylists(String email) {
        User user = getAuthenticatedUser(email);

        return playlistRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(PlaylistResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void addTrackToPlaylist(Long playlistId, TrackAddRequest request, String email) {
        User user = getAuthenticatedUser(email);

        Playlist playlist = playlistRepository.findByIdAndLock(playlistId)
                .orElseThrow(() -> new BusinessException("PLAYLIST_NOT_FOUND", "Playlist não encontrada."));

        // Regra: Impedir adição em playlist de outro usuário
        if (!playlist.getUser().getId().equals(user.getId())) {
            throw new BusinessException("UNAUTHORIZED_ACTION",
                    "Você não tem permissão para adicionar músicas nesta playlist.");
        }

        // Regra: Tratar duplicidade de faixas
        if (playlistTrackRepository.existsByPlaylistIdAndTrackSpotifyId(playlistId, request.trackSpotifyId())) {
            throw new BusinessException("TRACK_ALREADY_EXISTS", "Esta música já está na playlist.");
        }

        int nextPosition = playlistTrackRepository.findMaxPositionByPlaylistId(playlistId) + 1;

        PlaylistTrack track = new PlaylistTrack();
        track.setPlaylist(playlist);
        track.setTrackSpotifyId(request.trackSpotifyId());
        track.setAddedByUser(user);
        track.setPosition(nextPosition);
        track.setTitle(request.title());
        track.setArtist(request.artist());
        track.setImageUrl(request.imageUrl());

        playlistTrackRepository.save(track);
    }

    @Transactional(readOnly = true)
    public List<Long> getPlaylistsContainingTrack(String trackSpotifyId, String email) {
        User user = getAuthenticatedUser(email);
        return playlistTrackRepository.findPlaylistIdsByUserIdAndTrackId(user.getId(), trackSpotifyId);
    }

    @Transactional(readOnly = true)
    public PlaylistDetailsResponse getPlaylistDetails(Long playlistId, String email) {
        User user = getAuthenticatedUser(email);

        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new BusinessException("PLAYLIST_NOT_FOUND", "Playlist não encontrada."));

        // Validação de segurança: apenas o dono pode ver a playlist
        if (!playlist.getUser().getId().equals(user.getId())) {
            throw new BusinessException("UNAUTHORIZED_ACTION", "Você não tem permissão para acessar esta playlist.");
        }

        List<PlaylistTrackResponse> trackResponses = playlistTrackRepository
                .findAllByPlaylistIdOrderByPositionAsc(playlistId)
                .stream()
                .map(pt -> new PlaylistTrackResponse(
                        pt.getTrackSpotifyId(),
                        pt.getPosition(),
                        pt.getAddedAt(),
                        pt.getTitle(),
                        pt.getArtist(),
                        pt.getImageUrl()))
                .toList();

        return new PlaylistDetailsResponse(
                playlist.getId(),
                playlist.getName(),
                playlist.getIsFusion(),
                playlist.getCreatedAt(),
                trackResponses,
                playlist.getDescription());
    }

    @Transactional
    public void removeTrackFromPlaylist(Long playlistId, String trackSpotifyId, String email) {
        User user = getAuthenticatedUser(email);

        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new BusinessException("PLAYLIST_NOT_FOUND", "Playlist não encontrada."));

        // Validação de segurança: apenas o dono pode alterar a playlist
        if (!playlist.getUser().getId().equals(user.getId())) {
            throw new BusinessException("UNAUTHORIZED_ACTION",
                    "Você não tem permissão para remover músicas desta playlist.");
        }

        PlaylistTrack trackToRemove = playlistTrackRepository
                .findByPlaylistIdAndTrackSpotifyId(playlistId, trackSpotifyId)
                .orElseThrow(
                        () -> new BusinessException("TRACK_NOT_FOUND", "A música informada não está nesta playlist."));

        playlistTrackRepository.delete(trackToRemove);
    }

    @Transactional
    public void deletePlaylist(Long playlistId, String email) {
        User user = getAuthenticatedUser(email);

        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new BusinessException("PLAYLIST_NOT_FOUND", "Playlist não encontrada."));

        if (!playlist.getUser().getId().equals(user.getId())) {
            throw new BusinessException("UNAUTHORIZED_ACTION", "Você não tem permissão para excluir esta playlist.");
        }

        playlistTrackRepository.deleteAll(playlistTrackRepository.findAllByPlaylistIdOrderByPositionAsc(playlistId));
        playlistRepository.delete(playlist);
    }

    @Transactional
    public void updatePlaylist(Long playlistId, String email, String newName, String newDescription) {
        User user = getAuthenticatedUser(email);

        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new BusinessException("PLAYLIST_NOT_FOUND", "Playlist não encontrada."));

        if (!playlist.getUser().getId().equals(user.getId())) {
            throw new BusinessException("UNAUTHORIZED_ACTION", "Você não tem permissão para editar esta playlist.");
        }

        if (newName != null && !newName.isBlank()) {
            playlist.setName(newName.trim());
        }

        playlist.setDescription(newDescription != null ? newDescription.trim() : null);
        playlistRepository.save(playlist);
    }
}