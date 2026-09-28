package br.com.duotune.config;

import java.nio.charset.StandardCharsets;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.socket.messaging.StompSubProtocolErrorHandler;

public class StompErrorHandler extends StompSubProtocolErrorHandler {
    @Override
    public Message<byte[]> handleClientMessageProcessingError(Message<byte[]> clientMessage, Throwable error) {
        Throwable cause = error;
        while (cause != null && !(cause instanceof AccessDeniedException)) {
            cause = cause.getCause();
        }
        String message = cause == null
                ? "Não foi possível processar a mensagem da sala. Reconecte e tente novamente."
                : cause.getMessage();
        var headers = StompHeaderAccessor.create(StompCommand.ERROR);
        headers.setMessage(message);
        headers.setContentType(MimeTypeUtils.TEXT_PLAIN);
        return MessageBuilder.createMessage(message.getBytes(StandardCharsets.UTF_8), headers.getMessageHeaders());
    }
}