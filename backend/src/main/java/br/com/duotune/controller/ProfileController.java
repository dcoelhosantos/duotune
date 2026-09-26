package br.com.duotune.controller;

import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.Principal;
import java.util.Base64;

import javax.imageio.ImageIO;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import br.com.duotune.dto.UserResponse;
import br.com.duotune.exception.dto.ErrorResponse;
import br.com.duotune.model.User;
import br.com.duotune.repository.UserRepository;

@RestController
@RequestMapping("/api/v1/users/me")
public class ProfileController {
    private final UserRepository users;

    public ProfileController(UserRepository users) { this.users = users; }

    private User user(Principal principal) {
        return users.findByEmail(principal.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não encontrado. Entre novamente no DuoTune."));
    }

    private UserResponse response(User user) {
        return new UserResponse(
            user.getId(), 
            user.getName(), 
            user.getEmail(), 
            user.getProfileImageUrl(), 
            user.getCreatedAt()
        );
    }

    // Busca dados atuais do usuário.
    @GetMapping
    public UserResponse get(Principal principal) { 
        return response(user(principal)); 
    }

    // Atualiza o nome do usuário.
    public record ProfileRequest(String name) {}

    @PutMapping
    public UserResponse update(Principal principal, @RequestBody ProfileRequest request) {
        if (request.name() == null || request.name().trim().isEmpty() || request.name().trim().length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um nome de até 100 caracteres.");
        }
        var user = user(principal);
        user.setName(request.name().trim());
        return response(users.save(user));
    }

    // Atualiza a foto do perfil do usuário. 
    // A imagem é redimensionada para 256x256 pixels e convertida para JPG.
    @PostMapping("/photo")
    public UserResponse photo(Principal principal, @RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty() || file.getSize() > 2 * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escolha uma imagem de até 2 MB.");
        }
        // Sequência de validações do conteúdo e das dimensões da imagem.
        // Após validações, decodifica a imagem inteira.
        try (var input = ImageIO.createImageInputStream(file.getInputStream())) {
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
                var user = user(principal);
                user.setProfileImageUrl("data:image/jpeg;base64," + Base64.getEncoder().encodeToString(output.toByteArray()));
                return response(users.save(user));
            } finally { 
                reader.dispose(); 
            }
        }
    }

    // Deleta a foto do perfil do usuário, removendo a URL da imagem.
    @DeleteMapping("/photo")
    public UserResponse removePhoto(Principal principal) {
        var user = user(principal);
        user.setProfileImageUrl(null);
        return response(users.save(user));
    }

    // Tratamento de exceções para retornar mensagens em português ao frontend.
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> error(ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode()).body(new ErrorResponse("PROFILE_REQUEST_FAILED", exception.getReason() == null ? "Não foi possível processar a solicitação do perfil." : exception.getReason()));
    }

    @ExceptionHandler(IOException.class)
    public ResponseEntity<?> invalidImage() {
        return ResponseEntity.badRequest().body(new ErrorResponse("INVALID_PROFILE_IMAGE", "Não foi possível ler a imagem. Escolha outro arquivo."));
    }
}
