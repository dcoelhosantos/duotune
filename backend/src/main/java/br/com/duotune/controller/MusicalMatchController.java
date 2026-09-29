package br.com.duotune.controller;

import br.com.duotune.service.MusicalMatchService;
import br.com.duotune.dto.MatchResponse;

import br.com.duotune.exception.dto.ErrorResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.security.Principal;

@RestController
@RequestMapping("/api/v1/duos/match")
public class MusicalMatchController {
    private final MusicalMatchService service;
    public MusicalMatchController(MusicalMatchService service) { this.service = service; }

    @GetMapping
    public MatchResponse.Overview overview(Principal principal) { return service.overview(principal.getName()); }

    @PostMapping
    public MatchResponse.Overview calculate(Principal principal) { return service.calculate(principal.getName()); }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> error(ResponseStatusException error) {
        String code = switch (error.getStatusCode().value()) {
            case 404 -> "DUO_REQUIRED";
            case 422 -> "INSUFFICIENT_HISTORY";
            case 429 -> "SPOTIFY_RATE_LIMIT";
            case 409 -> "MATCH_UNAVAILABLE";
            default -> "MATCH_ERROR";
        };
        return ResponseEntity.status(error.getStatusCode()).body(new ErrorResponse(code,
                error.getReason() == null ? "Não foi possível consultar o match musical." : error.getReason()));
    }
}
