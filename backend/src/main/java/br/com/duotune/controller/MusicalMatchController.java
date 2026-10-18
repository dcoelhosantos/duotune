package br.com.duotune.controller;

import br.com.duotune.service.MusicalMatchService;
import br.com.duotune.dto.MatchResponse;

import org.springframework.web.bind.annotation.*;
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

}
