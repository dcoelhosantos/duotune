package br.com.duotune.dto;
import java.time.LocalDateTime;

public record UserResponse(Long id, String name, String email, String profileImageUrl, LocalDateTime createdAt, Long duoId) {
    public UserResponse(Long id, String name, String email, String profileImageUrl, LocalDateTime createdAt) {
        this(id, name, email, profileImageUrl, createdAt, null);
    }
}
