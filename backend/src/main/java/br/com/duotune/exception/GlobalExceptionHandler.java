package br.com.duotune.exception;

import br.com.duotune.exception.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.context.request.ServletWebRequest;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApplicationException.class)
    public ResponseEntity<Object> application(ApplicationException error, HttpServletRequest request) {
        int status = switch (error.getType()) {
            case INVALID_INPUT -> 400;
            case UNAUTHENTICATED -> 401;
            case FORBIDDEN -> 403;
            case NOT_FOUND -> 404;
            case CONFLICT -> 409;
            case UNPROCESSABLE -> 422;
            case RATE_LIMITED -> 429;
            case INTEGRATION_FAILURE -> 502;
            case INTERNAL_FAILURE -> 500;
        };
        return response(status, requestCode(request.getRequestURI(), status),
                error.getMessage() == null ? defaultMessage(request.getRequestURI()) : error.getMessage());
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Object> business(BusinessException error, HttpServletRequest request) {
        int status = switch (error.getCode()) {
            case "USER_NOT_FOUND" -> request.getRequestURI().startsWith("/api/v1/rooms/") ? 400 : 404;
            case "INVITATION_NOT_FOUND", "PLAYLIST_NOT_FOUND" -> 404;
            case "INVALID_INVITATION", "UNAUTHORIZED_ACTION" -> 403;
            case "SELF_INVITATION", "INVALID_OPERATION" -> 400;
            case "INVALID_CREDENTIALS" -> 401;
            case "TRACK_ALREADY_EXISTS", "EMAIL_ALREADY_EXISTS" -> 409;
            default -> request.getRequestURI().startsWith("/api/v1/duos") ? 409 : 400;
        };
        return response(status, error.getCode(), error.getMessage());
    }

    // Preserva os códigos públicos de cada funcionalidade, inclusive em serviços compartilhados.
    private String requestCode(String path, int status) {
        if (path.startsWith("/api/v1/rooms/")) return "ROOM_REQUEST_FAILED";
        if (path.startsWith("/api/v1/users/me")) return "PROFILE_REQUEST_FAILED";
        if (path.startsWith("/api/v1/memories")) return "MEMORY_REQUEST_FAILED";
        if (path.startsWith("/api/spotify")) return "SPOTIFY_REQUEST_FAILED";
        if (path.startsWith("/api/v1/duos/match")) {
            return switch (status) {
                case 404 -> "DUO_REQUIRED";
                case 422 -> "INSUFFICIENT_HISTORY";
                case 429 -> "SPOTIFY_RATE_LIMIT";
                case 409 -> "MATCH_UNAVAILABLE";
                default -> "MATCH_ERROR";
            };
        }
        return "REQUEST_FAILED";
    }

    private String defaultMessage(String path) {
        if (path.startsWith("/api/v1/duos/match")) return "Não foi possível consultar o match musical.";
        if (path.startsWith("/api/v1/users/me")) return "Não foi possível processar a solicitação do perfil.";
        if (path.startsWith("/api/v1/memories")) return "Não foi possível acessar o álbum de memórias.";
        if (path.startsWith("/api/spotify")) return "Não foi possível processar a solicitação ao Spotify.";
        return "Não foi possível processar a solicitação.";
    }

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception error, Object body,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        String code = "INVALID_DATA";
        String message = "Dados inválidos. Verifique a solicitação.";
        if (error instanceof MethodArgumentNotValidException validation) {
            var field = validation.getBindingResult().getFieldError();
            if (path.startsWith("/api/v1/duos/invitations")) {
                code = "INVALID_EMAIL";
                message = "Informe um e-mail válido.";
            } else {
                message = "Dados inválidos.";
            }
            if (field != null) message = field.getDefaultMessage();
        } else if (error instanceof HttpMessageNotReadableException) {
            message = "Corpo da solicitação inválido. Verifique os campos enviados.";
        } else if (error instanceof MaxUploadSizeExceededException) {
            code = "UPLOAD_TOO_LARGE";
            message = "O arquivo excede o tamanho permitido.";
        } else if (error instanceof org.springframework.web.server.ResponseStatusException explicit) {
            code = requestCode(path, status.value());
            message = explicit.getReason() == null ? defaultMessage(path) : explicit.getReason();
        } else {
            code = "REQUEST_FAILED";
            message = "Não foi possível atender à solicitação.";
        }
        HttpHeaders resultHeaders = new HttpHeaders();
        resultHeaders.putAll(headers);
        resultHeaders.setCacheControl("no-store");
        return super.handleExceptionInternal(error, new ErrorResponse(code, message), resultHeaders, status, request);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Object> validation(ConstraintViolationException error) {
        return response(400, "INVALID_DATA", "Dados inválidos. Verifique os campos informados.");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Object> authentication() {
        return response(401, "UNAUTHORIZED", "Entre na sua conta para continuar.");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Object> forbidden() {
        return response(403, "FORBIDDEN", "Você não tem permissão para realizar esta ação.");
    }

    @ExceptionHandler(RestClientException.class)
    public ResponseEntity<Object> integration(RestClientException error) {
        log.warn("Falha na comunicação com o Spotify: {}", error.getClass().getSimpleName());
        return response(502, "SPOTIFY_UNAVAILABLE", "Não foi possível acessar o Spotify. Tente novamente.");
    }

    @ExceptionHandler(IOException.class)
    public ResponseEntity<Object> image(IOException error, HttpServletRequest request) {
        if (request.getRequestURI().equals("/api/v1/users/me/photo")) {
            return response(400, "INVALID_PROFILE_IMAGE", "Não foi possível ler a imagem. Escolha outro arquivo.");
        }
        if (request.getRequestURI().equals("/api/v1/memories")) {
            return response(400, "INVALID_MEMORY_IMAGE", "Não foi possível ler a imagem. Escolha outro arquivo JPG ou PNG.");
        }
        return unexpected(error);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Object> integrity(DataIntegrityViolationException error) {
        return response(409, "DATA_CONFLICT", "Não foi possível salvar os dados devido a um conflito. Atualize e tente novamente.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> unexpected(Exception error) {
        log.error("Erro não tratado ao processar a solicitação", error);
        return response(500, "INTERNAL_ERROR", "Não foi possível concluir a solicitação. Tente novamente.");
    }

    private ResponseEntity<Object> response(int status, String code, String message) {
        return ResponseEntity.status(status).header("Cache-Control", "no-store")
                .body(new ErrorResponse(code, message));
    }
}