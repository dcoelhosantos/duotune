package br.com.duotune.controller;

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
    public ResponseEntity<Map<String, String>> checkInvitationStatus(@PathVariable String code) {
        String status = duoService.checkInvitationStatus(code);
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