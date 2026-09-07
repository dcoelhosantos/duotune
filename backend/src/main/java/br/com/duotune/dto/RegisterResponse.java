package br.com.duotune.dto;

public record RegisterResponse(UserResponse user, String accessToken, Long expiresIn) {}