package br.com.duotune.controller;

import br.com.duotune.dto.DuoResponse;
import br.com.duotune.dto.InvitationRequest;
import br.com.duotune.dto.InvitationResponse;
import br.com.duotune.service.DuoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/duos")
public class DuoController {

    private final DuoService duoService;

    public DuoController(DuoService duoService) {
        this.duoService = duoService;
    }

    @PostMapping("/invitations")
    public ResponseEntity<InvitationResponse> createInvitation(@Valid @RequestBody InvitationRequest request) {
        // mock do e-mail do remetente que o security deve dar
        String authenticatedEmail = "paulo@email.com";

        InvitationResponse response = duoService.createInvitation(request, authenticatedEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/invitations/{code}/accept")
    public ResponseEntity<DuoResponse> acceptInvitation(@PathVariable String code) {
        // mock do e-mail do destinatário que o security deve dar
        String authenticatedEmail = "paulo.ss.junior123@gmail.com";

        DuoResponse response = duoService.acceptInvitation(code, authenticatedEmail);
        return ResponseEntity.ok(response);
    }
}