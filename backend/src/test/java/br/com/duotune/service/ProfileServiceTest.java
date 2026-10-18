package br.com.duotune.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Optional;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import br.com.duotune.dto.ProfileRequest;
import br.com.duotune.exception.ApplicationException;
import br.com.duotune.exception.ErrorType;
import br.com.duotune.model.User;
import br.com.duotune.repository.DuoRepository;
import br.com.duotune.repository.UserRepository;

class ProfileServiceTest {

    private final UserRepository users = mock(UserRepository.class);
    private final DuoRepository duos = mock(DuoRepository.class);
    private final ImageProcessingService images = new ImageProcessingService();
    private ProfileService service;
    private User user;

    @BeforeEach
    void setup() {
        service = new ProfileService(users, images, duos);
        user = new User();
        user.setId(1L);
        user.setName("Nome Antigo");
        user.setEmail("user@example.com");

        when(users.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(duos.findActiveDuoId(1L)).thenReturn(Optional.of(10L));
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void updateChangesUserNameAndReturnsUpdatedProfile() {
        var response = service.update("user@example.com", new ProfileRequest("  Novo Nome  "));

        assertEquals("Novo Nome", response.name());
        assertEquals(10L, response.duoId());
        assertEquals("Novo Nome", user.getName());
        verify(users).save(user);
    }

    @Test
    void updateRejectsEmptyOrOverlongName() {
        var emptyError = assertThrows(ApplicationException.class, () ->
                service.update("user@example.com", new ProfileRequest("   ")));
        assertEquals(ErrorType.INVALID_INPUT, emptyError.getType());

        var longNameError = assertThrows(ApplicationException.class, () ->
                service.update("user@example.com", new ProfileRequest("a".repeat(101))));
        assertEquals(ErrorType.INVALID_INPUT, longNameError.getType());

        verify(users, never()).save(any());
    }

    @Test
    void updatePhotoProcessesAndStoresProfileImage() throws IOException {
        var image = new BufferedImage(300, 300, BufferedImage.TYPE_INT_RGB);
        var graphics = image.createGraphics();
        graphics.setColor(Color.MAGENTA);
        graphics.fillRect(0, 0, 300, 300);
        graphics.dispose();

        var bytes = new ByteArrayOutputStream();
        ImageIO.write(image, "png", bytes);
        var file = new MockMultipartFile("file", "avatar.png", "image/png", bytes.toByteArray());

        var response = service.updatePhoto("user@example.com", file);

        assertNotNull(response.profileImageUrl());
        assertTrue(response.profileImageUrl().startsWith("data:image/jpeg;base64,"));
        assertEquals(response.profileImageUrl(), user.getProfileImageUrl());
        verify(users).save(user);
    }

    @Test
    void updatePhotoRejectsEmptyOrInvalidImage() {
        var emptyFile = new MockMultipartFile("file", "empty.png", "image/png", new byte[0]);
        var emptyError = assertThrows(ApplicationException.class, () ->
                service.updatePhoto("user@example.com", emptyFile));
        assertEquals(ErrorType.INVALID_INPUT, emptyError.getType());

        var invalidFile = new MockMultipartFile("file", "not-image.txt", "text/plain", "texto".getBytes());
        var invalidError = assertThrows(ApplicationException.class, () ->
                service.updatePhoto("user@example.com", invalidFile));
        assertEquals(ErrorType.INVALID_INPUT, invalidError.getType());

        verify(users, never()).save(any());
    }

    @Test
    void removePhotoClearsProfileImageUrl() {
        user.setProfileImageUrl("data:image/jpeg;base64,abc");

        var response = service.removePhoto("user@example.com");

        assertNull(response.profileImageUrl());
        assertNull(user.getProfileImageUrl());
        verify(users).save(user);
    }
}
