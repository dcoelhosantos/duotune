package br.com.duotune.dto;
import java.time.LocalDateTime;

public record UserResponse(Long id, String name, String email, String profileImageUrl, LocalDateTime createdAt) {}