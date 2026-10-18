package br.com.duotune.service;

import java.io.IOException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import br.com.duotune.dto.ProfileRequest;
import br.com.duotune.dto.UserResponse;
import br.com.duotune.exception.ApplicationException;
import br.com.duotune.exception.ErrorType;
import br.com.duotune.model.User;
import br.com.duotune.repository.DuoRepository;
import br.com.duotune.repository.UserRepository;

@Service
public class ProfileService {

    private final UserRepository users;
    private final ImageProcessingService images;
    private final DuoRepository duos;

    public ProfileService(UserRepository users, ImageProcessingService images, DuoRepository duos) {
        this.users = users;
        this.images = images;
        this.duos = duos;
    }

    @Transactional(readOnly = true)
    public UserResponse get(String email) {
        return response(user(email));
    }

    @Transactional
    public UserResponse update(String email, ProfileRequest request) {
        if (request == null || request.name() == null || request.name().trim().isEmpty()
                || request.name().trim().length() > 100) {
            throw new ApplicationException(ErrorType.INVALID_INPUT, "Informe um nome de até 100 caracteres.");
        }
        User user = user(email);
        user.setName(request.name().trim());
        return response(users.save(user));
    }

    @Transactional
    public UserResponse updatePhoto(String email, MultipartFile file) throws IOException {
        if (file == null) {
            throw new ApplicationException(ErrorType.INVALID_INPUT, "Escolha uma imagem de até 2 MB.");
        }
        User user = user(email);
        user.setProfileImageUrl(images.createProfileImage(file));
        return response(users.save(user));
    }

    @Transactional
    public UserResponse removePhoto(String email) {
        User user = user(email);
        user.setProfileImageUrl(null);
        return response(users.save(user));
    }

    private User user(String email) {
        if (email == null || email.isBlank()) {
            throw new ApplicationException(ErrorType.UNAUTHENTICATED,
                    "Usuário não encontrado. Entre novamente no DuoTune.");
        }
        return users.findByEmail(email)
                .orElseThrow(() -> new ApplicationException(ErrorType.UNAUTHENTICATED,
                        "Usuário não encontrado. Entre novamente no DuoTune."));
    }

    private UserResponse response(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getProfileImageUrl(),
                user.getCreatedAt(),
                duos.findActiveDuoId(user.getId()).orElse(null)
        );
    }
}
