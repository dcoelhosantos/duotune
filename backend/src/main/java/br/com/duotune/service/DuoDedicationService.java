package br.com.duotune.service;

import br.com.duotune.dto.DedicationRequest;
import br.com.duotune.dto.DedicationResponse;
import br.com.duotune.model.Duo;
import br.com.duotune.model.DuoDedication;
import br.com.duotune.model.User;
import br.com.duotune.repository.DuoDedicationRepository;
import br.com.duotune.repository.DuoRepository;
import br.com.duotune.repository.UserRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import br.com.duotune.exception.ApplicationException;
import br.com.duotune.exception.ErrorType;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

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
                .orElseThrow(() -> new ApplicationException(ErrorType.FORBIDDEN, "Você não possui um Duo ativo."));

        Duo duo = duoRepository.findById(activeDuoId).orElseThrow();
        User receiver = duo.getUser1().getId().equals(sender.getId()) ? duo.getUser2() : duo.getUser1();

        // Garante que o fuso horário seja respeitado na validação
        LocalDate today = LocalDate.now(java.time.ZoneId.of("America/Sao_Paulo"));
        if (!request.scheduledDate().isAfter(today)) {
            throw new ApplicationException(ErrorType.INVALID_INPUT, "A data da surpresa deve ser no futuro.");
        }

        // Trava de leitura preventiva
        boolean alreadyScheduled = dedicationRepository.existsByReceiverIdAndScheduledDate(receiver.getId(),
                request.scheduledDate());
        if (alreadyScheduled) {
            throw new ApplicationException(ErrorType.CONFLICT, "Você já programou uma surpresa para este dia.");
        }

        DuoDedication dedication = new DuoDedication();
        dedication.setSender(sender);
        dedication.setReceiver(receiver);
        dedication.setTrackSpotifyId(request.trackSpotifyId());
        dedication.setTitle(request.title());
        dedication.setArtist(request.artist());
        dedication.setImageUrl(request.imageUrl());
        dedication.setMessage(request.message());
        dedication.setScheduledDate(request.scheduledDate());
        dedication.setDelivered(false);

        try {
            dedicationRepository.save(dedication);
        } catch (DataIntegrityViolationException e) {
            if (e.getMostSpecificCause() != null
                    && e.getMostSpecificCause().getMessage() != null
                    && e.getMostSpecificCause().getMessage().contains("uk_receiver_date")) {
                throw new ApplicationException(ErrorType.CONFLICT, "Você já programou uma surpresa para este dia.");
            }
            throw new ApplicationException(ErrorType.INTERNAL_FAILURE, "Erro ao processar a dedicatória.");
        }
    }

    @Transactional(readOnly = true)
    public DedicationResponse getPendingDedication(String email) {
        User receiver = userRepository.findByEmail(email).orElseThrow();

        Optional<Long> activeDuoId = duoRepository.findActiveDuoId(receiver.getId());
        if (activeDuoId.isEmpty()) {
            return null;
        }

        Duo activeDuo = duoRepository.findById(activeDuoId.get()).orElseThrow();
        Long partnerId = activeDuo.getUser1().getId().equals(receiver.getId())
                ? activeDuo.getUser2().getId()
                : activeDuo.getUser1().getId();

        LocalDate today = LocalDate.now(java.time.ZoneId.of("America/Sao_Paulo"));

        var optDedication = dedicationRepository
                .findFirstByReceiverIdAndSenderIdAndDeliveredFalseAndScheduledDateLessThanEqualOrderByScheduledDateAsc(
                        receiver.getId(), partnerId, today);

        if (optDedication.isEmpty())
            return null;

        DuoDedication dedication = optDedication.get();

        return new DedicationResponse(
                dedication.getId(),
                dedication.getTrackSpotifyId(),
                dedication.getTitle(),
                dedication.getArtist(),
                dedication.getImageUrl(),
                dedication.getMessage(),
                dedication.getScheduledDate());
    }

    @Transactional
    public void confirmDelivery(String email, Long dedicationId) {
        DuoDedication dedication = dedicationRepository.findById(dedicationId)
                .orElseThrow(() -> new ApplicationException(ErrorType.NOT_FOUND, "Surpresa não encontrada."));

        if (!dedication.getReceiver().getEmail().equals(email)) {
            throw new ApplicationException(ErrorType.FORBIDDEN, "Acesso negado.");
        }

        dedication.setDelivered(true);
        dedicationRepository.save(dedication);
    }

    @Transactional(readOnly = true)
    public List<DedicationResponse> getSentDedications(String email) {
        User sender = userRepository.findByEmail(email).orElseThrow();
        return dedicationRepository.findBySenderIdOrderByScheduledDateDesc(sender.getId())
                .stream()
                .map(d -> new DedicationResponse(d.getId(), d.getTrackSpotifyId(), d.getTitle(), d.getArtist(),
                        d.getImageUrl(), d.getMessage(), d.getScheduledDate()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DedicationResponse> getReceivedDedications(String email) {
        User receiver = userRepository.findByEmail(email).orElseThrow();
        LocalDate today = LocalDate.now(java.time.ZoneId.of("America/Sao_Paulo"));

        // Descobre o ID do parceiro atual (se houver)
        Optional<Long> activeDuoIdOpt = duoRepository.findActiveDuoId(receiver.getId());
        Long currentPartnerId = activeDuoIdOpt.map(duoId -> {
            Duo activeDuo = duoRepository.findById(duoId).orElseThrow();
            return activeDuo.getUser1().getId().equals(receiver.getId())
                    ? activeDuo.getUser2().getId()
                    : activeDuo.getUser1().getId();
        }).orElse(null);

        return dedicationRepository
                .findByReceiverIdAndScheduledDateLessThanEqualOrderByScheduledDateDesc(receiver.getId(), today)
                .stream()
                .filter(d -> d.isDelivered() || d.getSender().getId().equals(currentPartnerId))
                .map(d -> new DedicationResponse(d.getId(), d.getTrackSpotifyId(), d.getTitle(), d.getArtist(),
                        d.getImageUrl(), d.getMessage(), d.getScheduledDate()))
                .toList();
    }

    @Transactional
    public void deleteDedication(String email, Long dedicationId) {
        DuoDedication dedication = dedicationRepository.findById(dedicationId)
                .orElseThrow(() -> new ApplicationException(ErrorType.NOT_FOUND, "Dedicatória não encontrada."));

        // Apenas quem enviou pode apagar
        if (!dedication.getSender().getEmail().equals(email)) {
            throw new ApplicationException(ErrorType.FORBIDDEN,
                    "Você não tem permissão para excluir esta dedicatória.");
        }

        dedicationRepository.delete(dedication);
    }
}