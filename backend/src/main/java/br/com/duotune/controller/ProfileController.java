package br.com.duotune.controller;

import java.io.IOException;
import java.security.Principal;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import br.com.duotune.dto.ProfileRequest;
import br.com.duotune.dto.UserResponse;
import br.com.duotune.service.ProfileService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/users/me")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    // Busca dados atuais do usuário.
    @GetMapping
    public ResponseEntity<UserResponse> get(Principal principal) {
        return ResponseEntity.ok(profileService.get(principal.getName()));
    }

    // Atualiza o nome do usuário.
    @PutMapping
    public ResponseEntity<UserResponse> update(Principal principal, @Valid @RequestBody ProfileRequest request) {
        return ResponseEntity.ok(profileService.update(principal.getName(), request));
    }

    // Atualiza a foto do perfil do usuário.
    // A imagem é redimensionada para 256x256 pixels e convertida para JPG.
    @PostMapping("/photo")
    public ResponseEntity<UserResponse> photo(Principal principal, @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(profileService.updatePhoto(principal.getName(), file));
    }

    // Deleta a foto do perfil do usuário, removendo a URL da imagem.
    @DeleteMapping("/photo")
    public ResponseEntity<UserResponse> removePhoto(Principal principal) {
        return ResponseEntity.ok(profileService.removePhoto(principal.getName()));
    }
}
