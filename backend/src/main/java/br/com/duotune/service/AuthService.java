package br.com.duotune.service;

import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.duotune.dto.LoginRequest;
import br.com.duotune.dto.RegisterRequest;
import br.com.duotune.dto.RegisterResponse;
import br.com.duotune.dto.UserResponse;
import br.com.duotune.exception.BusinessException;
import br.com.duotune.model.User;
import br.com.duotune.repository.DuoRepository;
import br.com.duotune.repository.UserRepository;

@Service
public class AuthService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final long TOKEN_EXPIRATION_SECONDS = 7200L;

    private final UserRepository userRepository;
    private final DuoRepository duoRepository;
    private final TokenService tokenService;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AuthService(UserRepository userRepository, DuoRepository duoRepository, TokenService tokenService) {
        this(userRepository, duoRepository, tokenService, new BCryptPasswordEncoder());
    }

    public AuthService(UserRepository userRepository, DuoRepository duoRepository,
            TokenService tokenService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.duoRepository = duoRepository;
        this.tokenService = tokenService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        validateRegisterRequest(request);

        String name = request.name().trim();
        String email = request.email().trim();

        if (userRepository.findByEmail(email).isPresent()) {
            throw new BusinessException("EMAIL_ALREADY_EXISTS", "Já existe um usuário cadastrado com este e-mail.");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));

        User savedUser = userRepository.save(user);

        UserResponse userResponse = new UserResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getProfileImageUrl(),
                savedUser.getCreatedAt()
        );

        String token = tokenService.generateToken(savedUser.getEmail());
        return new RegisterResponse(userResponse, token, TOKEN_EXPIRATION_SECONDS);
    }

    @Transactional(readOnly = true)
    public RegisterResponse login(LoginRequest request) {
        validateLoginRequest(request);

        String email = request.email().trim();
        var userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty() || !passwordEncoder.matches(request.password(), userOptional.get().getPasswordHash())) {
            throw new BusinessException("INVALID_CREDENTIALS", "Credenciais inválidas.");
        }

        User user = userOptional.get();
        UserResponse userResponse = new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getProfileImageUrl(),
                user.getCreatedAt(),
                duoRepository.findActiveDuoId(user.getId()).orElse(null)
        );

        String token = tokenService.generateToken(user.getEmail());
        return new RegisterResponse(userResponse, token, TOKEN_EXPIRATION_SECONDS);
    }

    private void validateRegisterRequest(RegisterRequest request) {
        if (request == null) {
            throw new BusinessException("INVALID_DATA", "Dados inválidos.");
        }
        String name = request.name() == null ? "" : request.name().trim();
        if (name.length() < 2 || name.length() > 100) {
            throw new BusinessException("INVALID_DATA", "O nome deve ter entre 2 e 100 caracteres.");
        }
        String email = request.email() == null ? "" : request.email().trim();
        if (email.isEmpty() || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new BusinessException("INVALID_DATA", "Formato de e-mail inválido.");
        }
        if (request.password() == null || request.password().isBlank() || request.password().length() < 8) {
            throw new BusinessException("INVALID_DATA", "A senha deve ter no mínimo 8 caracteres.");
        }
    }

    private void validateLoginRequest(LoginRequest request) {
        if (request == null) {
            throw new BusinessException("INVALID_DATA", "Dados inválidos.");
        }
        String email = request.email() == null ? "" : request.email().trim();
        if (email.isEmpty() || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new BusinessException("INVALID_DATA", "Formato de e-mail inválido.");
        }
        if (request.password() == null || request.password().isBlank()) {
            throw new BusinessException("INVALID_DATA", "A senha é obrigatória.");
        }
    }
}
