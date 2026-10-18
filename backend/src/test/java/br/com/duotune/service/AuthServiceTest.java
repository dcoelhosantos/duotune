package br.com.duotune.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import br.com.duotune.dto.LoginRequest;
import br.com.duotune.dto.RegisterRequest;
import br.com.duotune.exception.BusinessException;
import br.com.duotune.model.User;
import br.com.duotune.repository.DuoRepository;
import br.com.duotune.repository.UserRepository;

class AuthServiceTest {

    private final UserRepository users = mock(UserRepository.class);
    private final DuoRepository duos = mock(DuoRepository.class);
    private final TokenService tokens = mock(TokenService.class);
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private AuthService service;

    @BeforeEach
    void setup() {
        service = new AuthService(users, duos, tokens, passwordEncoder);
    }

    @Test
    void registerCreatesUserWithEncodedPasswordAndReturnsToken() {
        when(users.findByEmail("ana@example.com")).thenReturn(Optional.empty());
        when(tokens.generateToken("ana@example.com")).thenReturn("jwt-token");
        when(users.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        var response = service.register(new RegisterRequest("  Ana Silva  ", "ana@example.com", "senha1234"));

        assertEquals(1L, response.user().id());
        assertEquals("Ana Silva", response.user().name());
        assertEquals("ana@example.com", response.user().email());
        assertEquals("jwt-token", response.accessToken());
        assertEquals(7200L, response.expiresIn());
        verify(users).save(argThat(user ->
                "Ana Silva".equals(user.getName())
                        && "ana@example.com".equals(user.getEmail())
                        && passwordEncoder.matches("senha1234", user.getPasswordHash())
        ));
    }

    @Test
    void registerRejectsDuplicateEmail() {
        User existing = new User();
        existing.setId(1L);
        existing.setEmail("duplicado@example.com");
        when(users.findByEmail("duplicado@example.com")).thenReturn(Optional.of(existing));

        var exception = assertThrows(BusinessException.class, () ->
                service.register(new RegisterRequest("Usuário", "duplicado@example.com", "senha1234")));

        assertEquals("EMAIL_ALREADY_EXISTS", exception.getCode());
        verify(users, never()).save(any());
        verifyNoInteractions(tokens);
    }

    @Test
    void registerRejectsInvalidInput() {
        assertEquals("INVALID_DATA", assertThrows(BusinessException.class, () ->
                service.register(new RegisterRequest("A", "valido@example.com", "senha1234"))).getCode());
        assertEquals("INVALID_DATA", assertThrows(BusinessException.class, () ->
                service.register(new RegisterRequest("Nome Válido", "email-invalido", "senha1234"))).getCode());
        assertEquals("INVALID_DATA", assertThrows(BusinessException.class, () ->
                service.register(new RegisterRequest("Nome Válido", "valido@example.com", "curta"))).getCode());
        verifyNoInteractions(users, tokens);
    }

    @Test
    void loginRejectsInvalidCredentialsWhenUserNotFoundOrPasswordDoesNotMatch() {
        User user = new User();
        user.setId(1L);
        user.setEmail("ana@example.com");
        user.setPasswordHash(passwordEncoder.encode("senhaCorreta123"));

        when(users.findByEmail("inexistente@example.com")).thenReturn(Optional.empty());
        when(users.findByEmail("ana@example.com")).thenReturn(Optional.of(user));

        var notFoundError = assertThrows(BusinessException.class, () ->
                service.login(new LoginRequest("inexistente@example.com", "senhaCorreta123")));
        assertEquals("INVALID_CREDENTIALS", notFoundError.getCode());

        var wrongPasswordError = assertThrows(BusinessException.class, () ->
                service.login(new LoginRequest("ana@example.com", "senhaErrada123")));
        assertEquals("INVALID_CREDENTIALS", wrongPasswordError.getCode());

        verifyNoInteractions(tokens);
    }

    @Test
    void loginReturnsTokenAndActiveDuoIdWhenCredentialsAreValid() {
        User user = new User();
        user.setId(5L);
        user.setName("Ana");
        user.setEmail("ana@example.com");
        user.setPasswordHash(passwordEncoder.encode("senhaCorreta123"));

        when(users.findByEmail("ana@example.com")).thenReturn(Optional.of(user));
        when(duos.findActiveDuoId(5L)).thenReturn(Optional.of(42L));
        when(tokens.generateToken("ana@example.com")).thenReturn("jwt-login-token");

        var response = service.login(new LoginRequest("ana@example.com", "senhaCorreta123"));

        assertEquals(5L, response.user().id());
        assertEquals(42L, response.user().duoId());
        assertEquals("jwt-login-token", response.accessToken());
    }
}
