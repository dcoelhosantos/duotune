package br.com.duotune.service;

import br.com.duotune.dto.*;
import br.com.duotune.exception.BusinessException;
import br.com.duotune.model.Duo;
import br.com.duotune.model.Invitation;
import br.com.duotune.model.User;
import br.com.duotune.model.enums.DuoStatus;
import br.com.duotune.model.enums.InvitationStatus;
import br.com.duotune.repository.DuoRepository;
import br.com.duotune.repository.InvitationRepository;
import br.com.duotune.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.List;

@Service
public class DuoService {

    private final DuoRepository duoRepository;
    private final InvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private static final String ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public DuoService(DuoRepository duoRepository, InvitationRepository invitationRepository, UserRepository userRepository, EmailService emailService) {
        this.duoRepository = duoRepository;
        this.invitationRepository = invitationRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @Transactional
    public InvitationResponse createInvitation(InvitationRequest request, String authenticatedEmail) {
        User sender = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Remetente não encontrado."));

        User recipient = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Destinatário não encontrado no sistema. Ele precisa se cadastrar primeiro."));

        if (sender.getId().equals(recipient.getId())) {
            throw new BusinessException("INVALID_OPERATION", "Você não pode formar um Duo consigo mesmo.");
        }

        if (duoRepository.existsActiveDuo(sender.getId(), DuoStatus.ACTIVE)) {
            throw new BusinessException("ALREADY_PAIRED", "Você já está em um Duo ativo.");
        }

        if (duoRepository.existsActiveDuo(recipient.getId(), DuoStatus.ACTIVE)) {
            throw new BusinessException("ALREADY_PAIRED", "O destinatário já está em um Duo ativo.");
        }

        if (invitationRepository.existsBySenderIdAndRecipientIdAndStatus(sender.getId(), recipient.getId(), InvitationStatus.PENDING)) {
            throw new BusinessException("INVITATION_ALREADY_EXISTS", "Já existe um convite pendente para este usuário.");
        }

        Invitation invitation = new Invitation();
        invitation.setSender(sender);
        invitation.setRecipient(recipient);
        invitation.setCode(gerarCodigoUnico());
        invitation.setStatus(InvitationStatus.PENDING);
        invitation.setSentAt(OffsetDateTime.now());
        invitation.setExpiresAt(OffsetDateTime.now().plusHours(24));

        invitation = invitationRepository.save(invitation);

        emailService.enviarEmailConvite(recipient.getEmail(), sender.getName(), invitation.getCode());

        return new InvitationResponse(
                new InvitationData(invitation.getId(), invitation.getCode(), invitation.getStatus(), invitation.getExpiresAt()),
                new RecipientData(recipient.getName(), recipient.getEmail())
        );
    }

    @Transactional
    public DuoResponse acceptInvitation(String code, String authenticatedEmail) {
        User authenticatedUser = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Usuário não encontrado."));

        Invitation invitation = invitationRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new BusinessException("INVITATION_NOT_FOUND", "Convite não encontrado."));

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new BusinessException("INVITATION_ALREADY_USED", "Este convite já foi processado ou cancelado.");
        }

        if (OffsetDateTime.now().isAfter(invitation.getExpiresAt())) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new BusinessException("INVITATION_EXPIRED", "Este convite expirou.");
        }

        if (!invitation.getRecipient().getId().equals(authenticatedUser.getId())) {
            throw new BusinessException("INVALID_INVITATION", "Este convite não pertence a você.");
        }

        Duo duo = new Duo();
        duo.setUser1(invitation.getSender());
        duo.setUser2(authenticatedUser);
        duo.setStatus(DuoStatus.ACTIVE);
        duo.setFormedAt(OffsetDateTime.now());
        duo = duoRepository.save(duo);

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitationRepository.save(invitation);

        UserResponse u1 = new UserResponse(duo.getUser1().getId(), duo.getUser1().getName(), duo.getUser1().getEmail(), duo.getUser1().getProfileImageUrl(), duo.getUser1().getCreatedAt());
        UserResponse u2 = new UserResponse(duo.getUser2().getId(), duo.getUser2().getName(), duo.getUser2().getEmail(), duo.getUser2().getProfileImageUrl(), duo.getUser2().getCreatedAt());

        DuoData duoData = new DuoData(duo.getId(), duo.getStatus(), duo.getFormedAt(), List.of(u1, u2));

        return new DuoResponse(duoData);
    }

    private String gerarCodigoUnico() {
        SecureRandom random = new SecureRandom();
        String code;
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(ALFABETO.charAt(random.nextInt(ALFABETO.length())));
            }
            code = sb.toString();
        } while (invitationRepository.findByCode(code).isPresent());

        return code;
    }
}