package br.com.duotune.controller;

import br.com.duotune.repository.DuoRepository;

import java.io.IOException;
import java.security.Principal;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import br.com.duotune.exception.ApplicationException;
import br.com.duotune.exception.ErrorType;

import br.com.duotune.dto.UserResponse;
import br.com.duotune.model.User;
import br.com.duotune.repository.UserRepository;
import br.com.duotune.service.ImageProcessingService;

@RestController
@RequestMapping("/api/v1/users/me")
public class ProfileController {
    private final UserRepository users;
    private final ImageProcessingService images;
    private final DuoRepository duos;

    public ProfileController(UserRepository users, ImageProcessingService images, DuoRepository duos) {
        this.users = users;
        this.images = images;
        this.duos = duos;
    }

    private User user(Principal principal) {
        return users.findByEmail(principal.getName()).orElseThrow(() -> new ApplicationException(ErrorType.UNAUTHENTICATED, "Usuário não encontrado. Entre novamente no DuoTune."));
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

    // Busca dados atuais do usuário.
    @GetMapping
    public UserResponse get(Principal principal) { 
        return response(user(principal)); 
    }

    // Atualiza o nome do usuário.
    public record ProfileRequest(String name) {}

    @PutMapping
    public UserResponse update(Principal principal, @RequestBody ProfileRequest request) {
        if (request.name() == null || request.name().trim().isEmpty() || request.name().trim().length() > 100) {
            throw new ApplicationException(ErrorType.INVALID_INPUT, "Informe um nome de até 100 caracteres.");
        }
        var user = user(principal);
        user.setName(request.name().trim());
        return response(users.save(user));
    }

    // Atualiza a foto do perfil do usuário. 
    // A imagem é redimensionada para 256x256 pixels e convertida para JPG.
    @PostMapping("/photo")
    public UserResponse photo(Principal principal, @RequestParam("file") MultipartFile file) throws IOException {
        var user = user(principal);
        user.setProfileImageUrl(images.createProfileImage(file));
        return response(users.save(user));
    }

    // Deleta a foto do perfil do usuário, removendo a URL da imagem.
    @DeleteMapping("/photo")
    public UserResponse removePhoto(Principal principal) {
        var user = user(principal);
        user.setProfileImageUrl(null);
        return response(users.save(user));
    }


}
