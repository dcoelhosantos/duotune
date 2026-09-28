package br.com.duotune.config;

import br.com.duotune.repository.DuoRepository;
import br.com.duotune.repository.UserRepository;
import br.com.duotune.service.TokenService;
import com.auth0.jwt.JWT;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class StompAccessInterceptor implements ChannelInterceptor {
    private final TokenService tokens;
    private final UserRepository users;
    private final DuoRepository duos;
    private final Map<String, SessionAccess> sessions = new ConcurrentHashMap<>();

    private record SessionAccess(Long userId, Long duoId, Instant expiresAt) {
        boolean valid() { return expiresAt != null && Instant.now().isBefore(expiresAt); }
    }

    public StompAccessInterceptor(TokenService tokens, UserRepository users, DuoRepository duos) {
        this.tokens = tokens;
        this.users = users;
        this.duos = duos;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        var headers = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (headers == null || headers.getCommand() == null) return message;
        String sessionId = headers.getSessionId();
        if (sessionId == null) throw new AccessDeniedException("Sessão STOMP inválida.");

        if (headers.getCommand() == StompCommand.CONNECT) {
            String authorization = headers.getFirstNativeHeader("Authorization");
            headers.removeNativeHeader("Authorization");
            if (authorization == null || !authorization.startsWith("Bearer ")) {
                throw new AccessDeniedException("Entre na sua conta para conectar à sala.");
            }
            String token = authorization.substring(7);
            String email = tokens.validateToken(token);
            if (email == null || email.isBlank()) {
                throw new AccessDeniedException("Sessão expirada ou inválida. Entre novamente.");
            }
            var user = users.findByEmail(email)
                    .orElseThrow(() -> new AccessDeniedException("Usuário não encontrado."));
            Long activeDuoId = duos.findActiveDuoId(user.getId()).orElse(null);
            var session = new SessionAccess(user.getId(), activeDuoId, JWT.decode(token).getExpiresAtAsInstant());
            if (!session.valid()) throw new AccessDeniedException("Sessão expirada ou inválida.");
            headers.setUser(new UsernamePasswordAuthenticationToken(email, null, List.of()));
            sessions.put(sessionId, session);
            return message;
        }

        if (headers.getCommand() == StompCommand.DISCONNECT) return message;
        SessionAccess session = sessions.get(sessionId);
        if (session == null || !session.valid()) {
            throw new AccessDeniedException("Sessão expirada ou inválida. Reconecte com um token válido.");
        }
        if (headers.getCommand() == StompCommand.SUBSCRIBE) {
            if (!canReceive(session, headers.getDestination())) {
                throw new AccessDeniedException("Você só pode acessar o canal do seu Duo ativo.");
            }
            return message;
        }
        if (headers.getCommand() == StompCommand.UNSUBSCRIBE) return message;
        throw new AccessDeniedException("Comando ainda não disponível na sala musical.");
    }

    private boolean canReceive(SessionAccess session, String destination) {
        if (!session.valid() || destination == null || session.duoId() == null) return false;
        return destination.equals("/topic/duos/" + session.duoId() + "/room");
    }

    public ChannelInterceptor outbound() {
        return new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                var headers = StompHeaderAccessor.wrap(message);
                if (headers.getMessageType() != SimpMessageType.MESSAGE) return message;
                // Authorize the receiving session, not the principal of the publisher.
                String sessionId = headers.getSessionId();
                SessionAccess session = sessionId == null ? null : sessions.get(sessionId);
                return session != null && canReceive(session, headers.getDestination()) ? message : null;
            }
        };
    }

    @EventListener
    public void disconnected(SessionDisconnectEvent event) {
        sessions.remove(event.getSessionId());
    }
}