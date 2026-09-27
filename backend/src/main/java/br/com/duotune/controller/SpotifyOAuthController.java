package br.com.duotune.controller;

import java.net.URI;
import java.security.Principal;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import br.com.duotune.service.SpotifyOAuthService;
import br.com.duotune.exception.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/spotify")
public class SpotifyOAuthController {
    private final SpotifyOAuthService spotify;
    private final String frontendUrl;
    private record Pending(String state, Long userId, Instant expiresAt) implements java.io.Serializable {}

    public SpotifyOAuthController(SpotifyOAuthService spotify, @Value("${frontend.url}") String frontendUrl) {
        this.spotify = spotify;
        this.frontendUrl = frontendUrl;
    }

    // Inicia a conexão com o Spotify, retornando a URL de autorização para o frontend. 
    // O estado é gerado aleatoriamente e armazenado na sessão do usuário.
    @GetMapping("/authorize")
    public ResponseEntity<?> authorize(Principal principal, HttpServletRequest request) {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        String state = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        var session = request.getSession(true);
        session.setAttribute("spotifyOAuth", new Pending(state, spotify.user(principal.getName()).getId(), Instant.now().plusSeconds(600)));
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(Map.of("url", spotify.authorizationUrl(state)));
    }

    // O endereço para o qual o Spotify redireciona após a autorização do usuário.
    // Verifica o estado e o código de autorização, e conecta a conta do usuário ao Spotify.
    @GetMapping("/callback")
    public ResponseEntity<Void> callback
    (
        @RequestParam(required = false) String state,
        @RequestParam(required = false) String code, 
        @RequestParam(required = false) String error,
        HttpServletRequest request
    ) {
        var session = request.getSession(false);
        Pending pending = null;
        if (session != null) {
            synchronized (session) {
                pending = (Pending) session.getAttribute("spotifyOAuth");
                session.removeAttribute("spotifyOAuth");
            }
        }
        String result = "invalid_state";
        if (pending != null && pending.state().equals(state) && pending.expiresAt().isAfter(Instant.now())) {
            result = "denied";
            if (error == null && code != null && !code.isBlank()) {
                try {
                    spotify.connect(pending.userId(), code);
                    result = "connected";
                } catch (RestClientException | ResponseStatusException e) {
                    result = "error";
                }
            }
        }
        return ResponseEntity.status(HttpStatus.FOUND).cacheControl(CacheControl.noStore())
            .location(URI.create(frontendUrl + "/perfil?spotify=" + result)).build();
    }

    /**
     * Endpoints auxiliares para o frontend verificar se o usuário está conectado ao Spotify, 
     * obter o token de acesso e renovar o token de acesso.
    */
    @GetMapping("/status")
    public Map<String, Object> status(Principal principal) {
        var user = spotify.user(principal.getName());
        return Map.of("connected", user.getSpotifyRefreshToken() != null);
    }

    @GetMapping("/token")
    public ResponseEntity<?> token(Principal principal) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(spotify.token(principal.getName(), false));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(Principal principal) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(spotify.token(principal.getName(), true));
    }

    // Desconecta somente a integração Spotify; a sessão do DuoTune continua ativa.
    @DeleteMapping("/disconnect")
    public ResponseEntity<Void> disconnect(Principal principal, HttpServletRequest request) {
        var session = request.getSession(false);
        if (session != null) {
            synchronized (session) {
                session.removeAttribute("spotifyOAuth");
            }
        }
        spotify.disconnect(principal.getName());
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }

    // Tratamento de exceções para retornar mensagens em português ao frontend.
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> error(ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).cacheControl(CacheControl.noStore())
            .body(new ErrorResponse("SPOTIFY_REQUEST_FAILED", error.getReason() == null ? "Não foi possível processar a solicitação ao Spotify." : error.getReason()));
    }

    @ExceptionHandler(RestClientException.class)
    public ResponseEntity<?> unavailable() {
        return ResponseEntity.status(502).body(new ErrorResponse("SPOTIFY_UNAVAILABLE", "Não foi possível acessar o Spotify. Tente novamente."));
    }
}
