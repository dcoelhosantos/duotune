package br.com.duotune.controller;

import br.com.duotune.dto.DedicationRequest;
import br.com.duotune.dto.DedicationResponse;
import br.com.duotune.service.DuoDedicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/duos/dedications")
public class DuoDedicationController {

    private final DuoDedicationService service;

    public DuoDedicationController(DuoDedicationService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Void> createDedication(Principal principal, @RequestBody DedicationRequest request) {
        service.createDedication(principal.getName(), request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/pending")
    public ResponseEntity<DedicationResponse> getPendingDedication(Principal principal) {
        DedicationResponse response = service.getPendingDedication(principal.getName());
        if (response == null) {
            return ResponseEntity.noContent().build(); // Status 204 se não houver música
        }
        return ResponseEntity.ok(response);
    }
}
