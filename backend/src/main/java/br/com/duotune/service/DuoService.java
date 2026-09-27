package br.com.duotune.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
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
    private final EntityManager entityManager;
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    public DuoService(DuoRepository duoRepository, InvitationRepository invitationRepository, UserRepository userRepository, EmailService emailService, EntityManager entityManager) {
        this.duoRepository = duoRepository;
        this.invitationRepository = invitationRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.entityManager = entityManager;
    }

    @Transactional
    public InvitationResponse createInvitation(InvitationRequest request, String authenticatedEmail) {
        User sender = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Remetente não encontrado."));

        User recipient = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Destinatário não encontrado no sistema. Ele precisa se cadastrar primeiro."));

        if (sender.getId().equals(recipient.getId())) {
            throw new BusinessException("SELF_INVITATION", "Você não pode enviar um convite para seu próprio e-mail.");
        }

        userRepository.lockParticipants(List.of(sender.getId(), recipient.getId()));

        if (duoRepository.existsActiveDuo(sender.getId(), DuoStatus.ACTIVE)) {
            throw new BusinessException("SENDER_ALREADY_PAIRED", "Você já possui um Duo e não pode enviar novos convites.");
        }

        if (duoRepository.existsActiveDuo(recipient.getId(), DuoStatus.ACTIVE)) {
            throw new BusinessException("RECIPIENT_ALREADY_PAIRED", "Esta pessoa já possui um Duo e não pode receber convites.");
        }

        if (invitationRepository.existsBySenderIdAndStatusAndExpiresAtAfter(sender.getId(), InvitationStatus.PENDING, OffsetDateTime.now())) {
            throw new BusinessException("INVITATION_ALREADY_EXISTS", "Você já tem um convite aguardando aceitação. Cancele-o ou aguarde sua expiração antes de enviar outro.");
        }

        Invitation invitation = new Invitation();
        invitation.setSender(sender);
        invitation.setRecipient(recipient);
        invitation.setCode(generateUniqueCode());
        invitation.setStatus(InvitationStatus.PENDING);
        invitation.setSentAt(OffsetDateTime.now());
        invitation.setExpiresAt(OffsetDateTime.now().plusHours(24));

        invitation = invitationRepository.save(invitation);

        try {
            emailService.sendInvitationEmail(recipient.getEmail(), sender.getName(), invitation.getCode());
        } catch (Exception e) {
            System.err.println("Aviso: Convite gerado no banco, mas falha ao enviar o e-mail do Google: " + e.getMessage());
        }

        return new InvitationResponse(
                new InvitationData(invitation.getId(), invitation.getCode(), invitation.getStatus(), invitation.getExpiresAt()),
                new RecipientData(recipient.getName(), recipient.getEmail())
        );
    }

    @Transactional
    public DuoResponse acceptInvitation(String code, String authenticatedEmail) {
        User authenticatedUser = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Usuário não encontrado."));

        String formattedCode = code.toUpperCase().trim();
        if (!formattedCode.startsWith("DUO-")) {
            formattedCode = "DUO-" + formattedCode;
        }

        Invitation invitation = invitationRepository.findByCode(formattedCode)
                .orElseThrow(() -> new BusinessException("INVITATION_NOT_FOUND", "Convite não encontrado."));

        if (!invitation.getRecipient().getId().equals(authenticatedUser.getId())) {
            throw new BusinessException("INVALID_INVITATION", "Este convite foi enviado para outra conta. Entre com o e-mail que recebeu o convite.");
        }

        userRepository.lockParticipants(List.of(invitation.getSender().getId(), authenticatedUser.getId()));
        entityManager.refresh(invitation, LockModeType.PESSIMISTIC_WRITE);
        validatePending(invitation);

        if (duoRepository.existsActiveDuo(authenticatedUser.getId(), DuoStatus.ACTIVE)) {
            throw new BusinessException("RECIPIENT_ALREADY_PAIRED", "Você já possui um Duo e não pode aceitar outro convite.");
        }
        if (duoRepository.existsActiveDuo(invitation.getSender().getId(), DuoStatus.ACTIVE)) {
            throw new BusinessException("SENDER_ALREADY_PAIRED", "Quem enviou este convite já formou um Duo. Este convite não pode mais ser aceito.");
        }

        Duo duo = new Duo();
        duo.setUser1(invitation.getSender());
        duo.setUser2(authenticatedUser);
        duo.setStatus(DuoStatus.ACTIVE);
        duo.setFormedAt(OffsetDateTime.now());
        duo = duoRepository.save(duo);

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitationRepository.save(invitation);

        UserResponse u1 = new UserResponse(duo.getUser1().getId(), duo.getUser1().getName(), duo.getUser1().getEmail(), duo.getUser1().getProfileImageUrl(), duo.getUser1().getCreatedAt(), duo.getId());
        UserResponse u2 = new UserResponse(duo.getUser2().getId(), duo.getUser2().getName(), duo.getUser2().getEmail(), duo.getUser2().getProfileImageUrl(), duo.getUser2().getCreatedAt(), duo.getId());

        DuoData duoData = new DuoData(duo.getId(), duo.getStatus(), duo.getFormedAt(), List.of(u1, u2));

        return new DuoResponse(duoData);
    }

    @Transactional
    public String checkInvitationStatus(String code, String authenticatedEmail) {
        String formattedCode = code.toUpperCase().trim();
        if (!formattedCode.startsWith("DUO-")) {
            formattedCode = "DUO-" + formattedCode;
        }

        Invitation invitation = invitationRepository.findByCode(formattedCode)
                .orElseThrow(() -> new BusinessException("INVITATION_NOT_FOUND", "Convite não encontrado."));

        if (!invitation.getSender().getEmail().equals(authenticatedEmail)
                && !invitation.getRecipient().getEmail().equals(authenticatedEmail)) {
            throw new BusinessException("INVALID_INVITATION", "Você não tem acesso a este convite.");
        }

        userRepository.lockParticipants(List.of(invitation.getSender().getId(), invitation.getRecipient().getId()));
        entityManager.refresh(invitation, LockModeType.PESSIMISTIC_WRITE);
        if (invitation.getStatus() == InvitationStatus.PENDING && !OffsetDateTime.now().isBefore(invitation.getExpiresAt())) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            return invitation.getStatus().name();
        }

        if (invitation.getStatus() == InvitationStatus.PENDING
                && (duoRepository.existsActiveDuo(invitation.getSender().getId(), DuoStatus.ACTIVE)
                || duoRepository.existsActiveDuo(invitation.getRecipient().getId(), DuoStatus.ACTIVE))) {
            throw new BusinessException("PARTICIPANT_ALREADY_PAIRED", "Um dos participantes já formou um Duo. Cancele este convite, pois ele não pode mais ser aceito.");
        }
        return invitation.getStatus().name();
    }

    @Transactional
    public void cancelInvitation(String code, String authenticatedEmail) {
        User authenticatedUser = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Usuário não encontrado."));

        String formattedCode = code.toUpperCase().trim();
        if (!formattedCode.startsWith("DUO-")) {
            formattedCode = "DUO-" + formattedCode;
        }

        Invitation invitation = invitationRepository.findByCode(formattedCode)
                .orElseThrow(() -> new BusinessException("INVITATION_NOT_FOUND", "Convite não encontrado."));

        if (!invitation.getSender().getId().equals(authenticatedUser.getId())) {
            throw new BusinessException("UNAUTHORIZED_ACTION", "Você não tem permissão para cancelar este convite.");
        }

        userRepository.lockParticipants(List.of(authenticatedUser.getId()));
        entityManager.refresh(invitation, LockModeType.PESSIMISTIC_WRITE);
        validatePending(invitation);
        invitation.setStatus(InvitationStatus.REJECTED);
        invitationRepository.save(invitation);
    }

    @Transactional(readOnly = true)
    public InvitationResponse pendingInvitation(String authenticatedEmail) {
        User sender = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Usuário não encontrado."));
        return invitationRepository.findFirstBySenderIdAndStatusAndExpiresAtAfterOrderBySentAtDesc(
                sender.getId(), InvitationStatus.PENDING, OffsetDateTime.now())
                .map(invitation -> new InvitationResponse(
                        new InvitationData(invitation.getId(), invitation.getCode(), invitation.getStatus(), invitation.getExpiresAt()),
                        new RecipientData(invitation.getRecipient().getName(), invitation.getRecipient().getEmail())))
                .orElse(null);
    }

    private void validatePending(Invitation invitation) {
        if (invitation.getStatus() == InvitationStatus.REJECTED) {
            throw new BusinessException("INVITATION_CANCELLED", "Este convite foi cancelado. Peça um novo convite ao remetente.");
        }
        if (invitation.getStatus() == InvitationStatus.ACCEPTED) {
            throw new BusinessException("INVITATION_ALREADY_USED", "Este convite já foi aceito.");
        }
        if (invitation.getStatus() == InvitationStatus.EXPIRED || !OffsetDateTime.now().isBefore(invitation.getExpiresAt())) {
            throw new BusinessException("INVITATION_EXPIRED", "Este convite expirou após 24 horas. Peça um novo convite ao remetente.");
        }
    }

    private String generateUniqueCode() {
        SecureRandom random = new SecureRandom();
        String code;
        do {
            StringBuilder sb = new StringBuilder(5);
            for (int i = 0; i < 5; i++) {
                sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
            }
            code = "DUO-" + sb;
        } while (invitationRepository.findByCode(code).isPresent());

        return code;
    }
}