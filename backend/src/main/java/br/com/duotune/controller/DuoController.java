package br.com.duotune.controller;

import br.com.duotune.dto.DuoResponse;
import org.springframework.security.authentication.InsufficientAuthenticationException;
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
        if (principal == null) {
            throw new InsufficientAuthenticationException("Entre na sua conta para continuar.");
        }
        InvitationResponse invitation = duoService.pendingInvitation(principal.getName());
        return invitation == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(invitation);
    }

    @PostMapping("/invitations")
    public ResponseEntity<InvitationResponse> createInvitation(@Valid @RequestBody InvitationRequest request,
            Principal principal) {
        if (principal == null) {
            throw new InsufficientAuthenticationException("Entre na sua conta para continuar.");
        }

        String authenticatedEmail = principal.getName();
        InvitationResponse response = duoService.createInvitation(request, authenticatedEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/invitations/{code}/accept")
    public ResponseEntity<DuoResponse> acceptInvitation(@PathVariable String code, Principal principal) {
        if (principal == null) {
            throw new InsufficientAuthenticationException("Entre na sua conta para continuar.");
        }

        String authenticatedEmail = principal.getName();
        DuoResponse response = duoService.acceptInvitation(code, authenticatedEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/invitations/{code}/status")
    public ResponseEntity<Map<String, String>> checkInvitationStatus(@PathVariable String code, Principal principal) {
        if (principal == null) {
            throw new InsufficientAuthenticationException("Entre na sua conta para continuar.");
        }
        String status = duoService.checkInvitationStatus(code, principal.getName());
        return ResponseEntity.ok(Map.of("status", status));
    }

    @DeleteMapping("/invitations/{code}")
    public ResponseEntity<Void> cancelInvitation(@PathVariable String code, Principal principal) {
        if (principal == null) {
            throw new InsufficientAuthenticationException("Entre na sua conta para continuar.");
        }

        String authenticatedEmail = principal.getName();
        duoService.cancelInvitation(code, authenticatedEmail);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/active")
    public ResponseEntity<DuoResponse> getActiveDuo(Principal principal) {
        if (principal == null) {
            throw new InsufficientAuthenticationException("Entre na sua conta para continuar.");
        }
        DuoResponse response = duoService.getActiveDuo(principal.getName());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/active")
    public ResponseEntity<Void> terminateActiveDuo(Principal principal) {
        if (principal == null) {
            throw new InsufficientAuthenticationException("Entre na sua conta para continuar.");
        }
        duoService.terminateActiveDuo(principal.getName());
        return ResponseEntity.noContent().build();
    }
}