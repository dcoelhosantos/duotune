package br.com.duotune.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendInvitationEmail(String recipientEmail, String senderName, String invitationCode) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            helper.setTo(recipientEmail);
            helper.setSubject("Você recebeu um convite no DuoTune! 🎵");

            String htmlMsg = "<p>Olá!</p>" +
                    "<p><b>" + senderName + "</b> acabou de te convidar para formar um Duo no DuoTune!</p>" +
                    "<br>" +
                    "<p>Seu código de pareamento é:</p>" +
                    "<h2><strong style='color: #4CAF50; letter-spacing: 2px;'>" + invitationCode + "</strong></h2>" +
                    "<br>" +
                    "<p>Acesse o aplicativo, insira este código e comecem a compartilhar músicas.</p>" +
                    "<p><small>Este convite expira em 24 horas.</small></p>" +
                    "<br>" +
                    "<p>Equipe DuoTune.</p>";

            helper.setText(htmlMsg, true);

            mailSender.send(mimeMessage);

        } catch (MessagingException e) {
            logger.error("Erro ao enviar e-mail HTML para {}: {}", recipientEmail, e.getMessage(), e);
        }
    }
}