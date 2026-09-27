package br.com.duotune.service;

import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

import javax.imageio.ImageIO;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ImageProcessingService {
    // Valida a foto, recorta o centro e converte para JPG de 256x256 pixels.
    public String createProfileImage(MultipartFile file) throws IOException {
        if (file.isEmpty() || file.getSize() > 2 * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escolha uma imagem de até 2 MB.");
        }
        // Sequência de validações do conteúdo e das dimensões da imagem.
        // Após validações, decodifica a imagem inteira.
        try (var stream = file.getInputStream();
                var input = ImageIO.createImageInputStream(stream)) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use uma imagem JPG ou PNG válida.");
            var reader = readers.next();
            try {
                reader.setInput(input);
                String format = reader.getFormatName();
                if (!(format.equalsIgnoreCase("jpeg") || format.equalsIgnoreCase("png")) ||
                        (long) reader.getWidth(0) * reader.getHeight(0) > 16000000) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use JPG ou PNG de até 16 megapixels.");
                }
                var original = reader.read(0);
                int side = Math.min(original.getWidth(), original.getHeight());
                var avatar = new BufferedImage(256, 256, BufferedImage.TYPE_INT_RGB);
                var graphics = avatar.createGraphics();
                graphics.setColor(java.awt.Color.WHITE);
                graphics.fillRect(0, 0, 256, 256);
                graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                int x = (original.getWidth() - side) / 2;
                int y = (original.getHeight() - side) / 2;
                graphics.drawImage(original, 0, 0, 256, 256, x, y, x + side, y + side, null);
                graphics.dispose();
                var output = new ByteArrayOutputStream();
                ImageIO.write(avatar, "jpg", output);
                return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(output.toByteArray());
            } finally {
                reader.dispose();
            }
        }
    }
}
