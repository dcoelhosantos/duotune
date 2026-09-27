package br.com.duotune.controller;

import br.com.duotune.exception.BusinessException;
import br.com.duotune.exception.dto.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import br.com.duotune.dto.DuoResponse;
import br.com.duotune.dto.InvitationRequest;
import br.com.duotune.dto.InvitationResponse;
import br.com.duotune.service.DuoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/duos")
public class DuoController {

    private final DuoService duoService;

    public DuoController(DuoService duoService) {
        this.duoService = duoService;
    }

    @GetMapping("/invitations/pending")
    public ResponseEntity<InvitationResponse> pendingInvitation(Principal principal) {
        InvitationResponse invitation = duoService.pendingInvitation(principal.getName());
        return invitation == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(invitation);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> businessError(BusinessException error) {
        HttpStatus status = switch (error.getCode()) {
            case "USER_NOT_FOUND", "INVITATION_NOT_FOUND" -> HttpStatus.NOT_FOUND;
            case "INVALID_INVITATION", "UNAUTHORIZED_ACTION" -> HttpStatus.FORBIDDEN;
            case "SELF_INVITATION", "INVALID_OPERATION" -> HttpStatus.BAD_REQUEST;
            default -> HttpStatus.CONFLICT;
        };
        return ResponseEntity.status(status).body(new ErrorResponse(error.getCode(), error.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> invalidRequest(MethodArgumentNotValidException error) {
        var field = error.getBindingResult().getFieldError();
        return ResponseEntity.badRequest().body(new ErrorResponse("INVALID_EMAIL",
                field == null ? "Informe um e-mail válido." : field.getDefaultMessage()));
    }

    @PostMapping("/invitations")
    public ResponseEntity<InvitationResponse> createInvitation(@Valid @RequestBody InvitationRequest request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String authenticatedEmail = principal.getName();
        InvitationResponse response = duoService.createInvitation(request, authenticatedEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/invitations/{code}/accept")
    public ResponseEntity<DuoResponse> acceptInvitation(@PathVariable String code, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String authenticatedEmail = principal.getName();
        DuoResponse response = duoService.acceptInvitation(code, authenticatedEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/invitations/{code}/status")
    public ResponseEntity<Map<String, String>> checkInvitationStatus(@PathVariable String code, Principal principal) {
        String status = duoService.checkInvitationStatus(code, principal.getName());
        return ResponseEntity.ok(Map.of("status", status));
    }

    @DeleteMapping("/invitations/{code}")
    public ResponseEntity<Void> cancelInvitation(@PathVariable String code, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String authenticatedEmail = principal.getName();
        duoService.cancelInvitation(code, authenticatedEmail);

        return ResponseEntity.noContent().build();
    }
}