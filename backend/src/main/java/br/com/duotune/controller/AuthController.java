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
import br.com.duotune.exception.dto.ErrorResponse;
import br.com.duotune.model.User;
import br.com.duotune.repository.UserRepository;
import br.com.duotune.service.TokenService;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository repository;

    @Autowired 
    private TokenService tokenService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {

        if (repository.findByEmail(request.email()).isPresent()) {
                return ResponseEntity.status(409).body(
                        new ErrorResponse("EMAIL_ALREADY_EXISTS", "Já existe um usuário cadastrado com este e-mail.")
                );
        }

        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));

        User savedUser = repository.save(user);

        UserResponse userResponse = new UserResponse(
                savedUser.getId(), savedUser.getName(), savedUser.getEmail(),
                savedUser.getProfileImageUrl(), savedUser.getCreatedAt());

        String token = tokenService.generateToken(savedUser.getEmail());
        RegisterResponse response = new RegisterResponse(userResponse, token, 7200L);

        return ResponseEntity.created(URI.create("/api/v1/users/" + savedUser.getId())).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        var userOptional = repository.findByEmail(request.email());

        if (userOptional.isEmpty() || !passwordEncoder.matches(request.password(), userOptional.get().getPasswordHash())) {
                return ResponseEntity.status(401).body(
                        new ErrorResponse("INVALID_CREDENTIALS", "Credenciais inválidas.")
                );
        }

        User user = userOptional.get();
        UserResponse userResponse = new UserResponse(
                user.getId(), user.getName(), user.getEmail(),
                user.getProfileImageUrl(), user.getCreatedAt());

        String token = tokenService.generateToken(user.getEmail());
        RegisterResponse response = new RegisterResponse(userResponse, token, 7200L);

        return ResponseEntity.ok(response);
    }
}