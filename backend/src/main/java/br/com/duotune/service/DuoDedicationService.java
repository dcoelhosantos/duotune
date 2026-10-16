package br.com.duotune.service;

import br.com.duotune.dto.DedicationRequest;
import br.com.duotune.dto.DedicationResponse;
import br.com.duotune.model.Duo;
import br.com.duotune.model.DuoDedication;
import br.com.duotune.model.User;
import br.com.duotune.repository.DuoDedicationRepository;
import br.com.duotune.repository.DuoRepository;
import br.com.duotune.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

@Service
public class DuoDedicationService {

    private final DuoDedicationRepository dedicationRepository;
    private final UserRepository userRepository;
    private final DuoRepository duoRepository;

    public DuoDedicationService(DuoDedicationRepository dedicationRepository, UserRepository userRepository,
            DuoRepository duoRepository) {
        this.dedicationRepository = dedicationRepository;
        this.userRepository = userRepository;
        this.duoRepository = duoRepository;
    }

    @Transactional
    public void createDedication(String email, DedicationRequest request) {
        User sender = userRepository.findByEmail(email).orElseThrow();

        Long activeDuoId = duoRepository.findActiveDuoId(sender.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Você não possui um Duo ativo."));

        Duo duo = duoRepository.findById(activeDuoId).orElseThrow();
        User receiver = duo.getUser1().getId().equals(sender.getId()) ? duo.getUser2() : duo.getUser1();

        // Só permite datas de amanhã em diante
        if (!request.scheduledDate().isAfter(LocalDate.now(java.time.ZoneId.of("America/Sao_Paulo")))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A data da surpresa deve ser no futuro.");
        }

        DuoDedication dedication = new DuoDedication();
        dedication.setSender(sender);
        dedication.setReceiver(receiver);
        dedication.setTrackSpotifyId(request.trackSpotifyId());
        dedication.setTitle(request.title());
        dedication.setArtist(request.artist());
        dedication.setImageUrl(request.imageUrl());
        dedication.setScheduledDate(request.scheduledDate());
        dedication.setDelivered(false);

        dedicationRepository.save(dedication);
    }

    @Transactional
    public DedicationResponse getPendingDedication(String email) {
        User receiver = userRepository.findByEmail(email).orElseThrow();

        // Procura se tem alguma surpresa agendada pra hoje (ou atrasada) não entregue
        var optDedication = dedicationRepository
                .findFirstByReceiverIdAndDeliveredFalseAndScheduledDateLessThanEqualOrderByScheduledDateAsc(
                        receiver.getId(), LocalDate.now(java.time.ZoneId.of("America/Sao_Paulo")));

        if (optDedication.isEmpty()) {
            return null;
        }

        DuoDedication dedication = optDedication.get();

        dedication.setDelivered(true);
        dedicationRepository.save(dedication);

        return new DedicationResponse(
                dedication.getTrackSpotifyId(),
                dedication.getTitle(),
                dedication.getArtist(),
                dedication.getImageUrl());
    }
}