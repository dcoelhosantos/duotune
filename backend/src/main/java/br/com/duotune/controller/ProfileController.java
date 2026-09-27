package br.com.duotune.controller;

import br.com.duotune.repository.DuoRepository;

import java.io.IOException;
import java.security.Principal;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import br.com.duotune.dto.UserResponse;
import br.com.duotune.exception.dto.ErrorResponse;
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
        return users.findByEmail(principal.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não encontrado. Entre novamente no DuoTune."));
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
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um nome de até 100 caracteres.");
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

    // Tratamento de exceções para retornar mensagens em português ao frontend.
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> error(ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode()).body(new ErrorResponse("PROFILE_REQUEST_FAILED", exception.getReason() == null ? "Não foi possível processar a solicitação do perfil." : exception.getReason()));
    }

    @ExceptionHandler(IOException.class)
    public ResponseEntity<?> invalidImage() {
        return ResponseEntity.badRequest().body(new ErrorResponse("INVALID_PROFILE_IMAGE", "Não foi possível ler a imagem. Escolha outro arquivo."));
    }
}
