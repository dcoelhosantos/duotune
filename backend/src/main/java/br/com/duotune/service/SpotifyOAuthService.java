package br.com.duotune.service;

import java.time.Instant;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import br.com.duotune.model.User;
import br.com.duotune.repository.UserRepository;

@Service
public class SpotifyOAuthService {
    public static final String SCOPES = "streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state";
    private final UserRepository users;
    private final RestTemplate http;
    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;

    public SpotifyOAuthService(UserRepository users,
            @Value("${spotify.client.id}") String clientId,
            @Value("${spotify.client.secret}") String clientSecret,
            @Value("${spotify.redirect.uri}") String redirectUri) {
        this.users = users;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
        this.http = createHttpClient();
    }

    // Define limites de espera para conexão e resposta do Spotify.
    private static RestTemplate createHttpClient() {
        var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(15000);
        return new RestTemplate(factory);
    }

    // Busca o usuário do DuoTune pelo e-mail da autenticação.
    public User user(String email) {
        return users.findByEmail(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não encontrado. Entre novamente no DuoTune."));
    }

    // Monta a URL de autorização com as permissões e o state que será validado no retorno.
    public String authorizationUrl(String state) {
        return UriComponentsBuilder.fromUriString("https://accounts.spotify.com/authorize")
            .queryParam("response_type", "code").queryParam("client_id", clientId)
            .queryParam("redirect_uri", redirectUri).queryParam("scope", SCOPES)
            .queryParam("state", state).build().encode().toUriString();
    }

    // Envia as credenciais do aplicativo e o formulário para obter tokens do Spotify.
    // O formulário pode conter o código de autorização ou o refresh token.
    @SuppressWarnings("rawtypes")
    private Map exchange(LinkedMultiValueMap<String, String> form) {
        var headers = new HttpHeaders();
        headers.setBasicAuth(clientId, clientSecret);
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        return http.postForObject("https://accounts.spotify.com/api/token", new HttpEntity<>(form, headers), Map.class);
    }

    // Salva o acesso e calcula seu vencimento a partir da duração informada pelo Spotify.
    @SuppressWarnings("rawtypes")
    private void saveTokens(User user, Map tokens) {
        if (tokens == null || !(tokens.get("access_token") instanceof String) || !(tokens.get("expires_in") instanceof Number)) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Resposta inválida do Spotify.");
        }
        user.setSpotifyAccessToken((String) tokens.get("access_token"));
        // Mantém o refresh token anterior quando o Spotify não envia um substituto.
        if (tokens.get("refresh_token") instanceof String refresh) user.setSpotifyRefreshToken(refresh);
        user.setSpotifyExpiresAt(Instant.now().plusSeconds(((Number) tokens.get("expires_in")).longValue()));
        users.save(user);
    }

    // Troca o código autorizado por tokens e vincula a conta Spotify ao usuário do DuoTune.
    // A sincronização evita trocas simultâneas nesta instância do serviço.
    public synchronized void connect(Long userId, String code) {
        var user = users.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não encontrado. Entre novamente no DuoTune."));
        var form = new LinkedMultiValueMap<String, String>();
        form.add("grant_type", "authorization_code");
        form.add("code", code);
        form.add("redirect_uri", redirectUri);
        var tokens = exchange(form);
        if (tokens == null || !(tokens.get("refresh_token") instanceof String)) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Reconecte sua conta Spotify.");
        }
        // Consulta o perfil autorizado para salvar o identificador da conta Spotify.
        var headers = new HttpHeaders();
        headers.setBearerAuth((String) tokens.get("access_token"));
        var profile = http.exchange("https://api.spotify.com/v1/me", HttpMethod.GET, new HttpEntity<>(headers), Map.class).getBody();
        if (profile == null || profile.get("id") == null) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Não foi possível identificar sua conta Spotify.");
        user.setSpotifyId(profile.get("id").toString());
        saveTokens(user, tokens);
    }

    // Remove o vínculo sem permitir que uma renovação em andamento restaure os tokens.
    public synchronized void disconnect(String email) {
        var user = user(email);
        user.setSpotifyId(null);
        user.setSpotifyAccessToken(null);
        user.setSpotifyRefreshToken(null);
        user.setSpotifyExpiresAt(null);
        users.save(user);
    }

    // Retorna o token atual ou renova quando solicitado ou próximo do vencimento.
    public synchronized Map<String, Object> token(String email, boolean force) {
        var user = user(email);
        if (user.getSpotifyRefreshToken() == null) throw new ResponseStatusException(HttpStatus.CONFLICT, "Conecte sua conta Spotify no perfil.");
        // Renova com um minuto de antecedência para não entregar um token prestes a vencer.
        if (force || user.getSpotifyExpiresAt() == null || user.getSpotifyExpiresAt().isBefore(Instant.now().plusSeconds(60))) {
            var form = new LinkedMultiValueMap<String, String>();
            form.add("grant_type", "refresh_token");
            form.add("refresh_token", user.getSpotifyRefreshToken());
            try {
                saveTokens(user, exchange(form));
            } catch (HttpClientErrorException.BadRequest | HttpClientErrorException.Unauthorized e) {
                // Só remove o vínculo quando o Spotify confirma que a autorização foi invalidada.
                var failure = e.getResponseBodyAs(Map.class);
                if (failure == null || !"invalid_grant".equals(failure.get("error"))) {
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Não foi possível renovar o acesso ao Spotify. Tente novamente.");
                }
                user.setSpotifyAccessToken(null);
                user.setSpotifyRefreshToken(null);
                user.setSpotifyExpiresAt(null);
                users.save(user);
                throw new ResponseStatusException(HttpStatus.CONFLICT, "A conexão expirou. Conecte o Spotify novamente.");
            }
        }
        // O SDK recebe apenas o access token; o refresh token permanece no backend.
        return Map.of("access_token", user.getSpotifyAccessToken(), "expires_at", user.getSpotifyExpiresAt().toString());
    }
}
