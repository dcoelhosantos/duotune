package br.com.duotune.controller;

import java.net.URI;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.duotune.dto.LoginRequest;
import br.com.duotune.dto.RegisterRequest;
import br.com.duotune.dto.RegisterResponse;
import br.com.duotune.dto.UserResponse;
import br.com.duotune.model.User;
import br.com.duotune.repository.UserRepository;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository repository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (repository.findByEmail(request.email()).isPresent()) {
            // TODO: criar uma classe de erro padronizada
            return ResponseEntity.status(409).body(
                    "{\"code\": \"EMAIL_ALREADY_EXISTS\", \"message\": \"Já existe um usuário cadastrado com este e-mail.\"}");
        }

        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));

        User savedUser = repository.save(user);

        UserResponse userResponse = new UserResponse(
                savedUser.getId(), savedUser.getName(), savedUser.getEmail(),
                savedUser.getProfileImageUrl(), savedUser.getCreatedAt());

        // TODO: implementar a geração de token JWT real
        RegisterResponse response = new RegisterResponse(userResponse, "token-jwt-fake-provisorio", 3600L);

        return ResponseEntity.created(URI.create("/api/v1/users/" + savedUser.getId())).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        var userOptional = repository.findByEmail(request.email());

        // Verifica se o usuário existe e se a senha bate com o hash salvo
        if (userOptional.isEmpty()
                || !passwordEncoder.matches(request.password(), userOptional.get().getPasswordHash())) {
            return ResponseEntity.status(401)
                    .body("{\"code\": \"INVALID_CREDENTIALS\", \"message\": \"Credenciais inválidas.\"}");
        }

        User user = userOptional.get();
        UserResponse userResponse = new UserResponse(
                user.getId(), user.getName(), user.getEmail(),
                user.getProfileImageUrl(), user.getCreatedAt());

        // Retorna a mesma estrutura do cadastro para o frontend reaproveitar
        RegisterResponse response = new RegisterResponse(userResponse, "token-jwt-fake-provisorio", 3600L);

        return ResponseEntity.ok(response);
    }
}