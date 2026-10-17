package br.com.duotune.controller;

import br.com.duotune.dto.DedicationRequest;
import br.com.duotune.dto.DedicationResponse;
import br.com.duotune.service.DuoDedicationService;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/duos/dedications")
public class DuoDedicationController {

    private final DuoDedicationService service;

    public DuoDedicationController(DuoDedicationService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Void> createDedication(Principal principal, @Valid @RequestBody DedicationRequest request) {
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

    @PostMapping("/{id}/deliver")
    public ResponseEntity<Void> confirmDelivery(Principal principal, @PathVariable Long id) {
        service.confirmDelivery(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/sent")
    public ResponseEntity<List<DedicationResponse>> getSentDedications(Principal principal) {
        return ResponseEntity.ok(service.getSentDedications(principal.getName()));
    }

    @GetMapping("/received")
    public ResponseEntity<List<DedicationResponse>> getReceivedDedications(Principal principal) {
        return ResponseEntity.ok(service.getReceivedDedications(principal.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDedication(Principal principal, @PathVariable Long id) {
        service.deleteDedication(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
