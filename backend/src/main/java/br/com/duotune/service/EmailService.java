package br.com.duotune.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void enviarEmailConvite(String destinatarioEmail, String nomeRemetente, String codigoConvite) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            helper.setTo(destinatarioEmail);
            helper.setSubject("Você recebeu um convite no DuoTune! 🎵");

            String htmlMsg = "<p>Olá!</p>" +
                    "<p><b>" + nomeRemetente + "</b> acabou de te convidar para formar um Duo no DuoTune!</p>" +
                    "<br>" +
                    "<p>Seu código de pareamento é:</p>" +
                    "<h2><strong style='color: #4CAF50; letter-spacing: 2px;'>" + codigoConvite + "</strong></h2>" +
                    "<br>" +
                    "<p>Acesse o aplicativo, insira este código e comecem a compartilhar músicas.</p>" +
                    "<p><small>Este convite expira em 24 horas.</small></p>" +
                    "<br>" +
                    "<p>Equipe DuoTune.</p>";

            helper.setText(htmlMsg, true);

            mailSender.send(mimeMessage);

        } catch (MessagingException e) {
            System.err.println("Erro ao enviar e-mail HTML: " + e.getMessage());
        }
    }
}