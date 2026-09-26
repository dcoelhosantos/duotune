package br.com.duotune.model;

import java.time.Instant;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "profile_image_url", columnDefinition = "text")
    private String profileImageUrl;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @JsonIgnore
    @Column(length = 2048)
    private String spotifyId;

    @JsonIgnore
    @Column(length = 2048)
    private String spotifyAccessToken;

    @JsonIgnore
    @Column(length = 2048)
    private String spotifyRefreshToken;

    @JsonIgnore
    private Instant spotifyExpiresAt;

    // Métodos de acesso
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @JsonIgnore
    public String getSpotifyId() { return spotifyId; }
    public void setSpotifyId(String spotifyId) { this.spotifyId = spotifyId; }

    @JsonIgnore
    public String getSpotifyAccessToken() { return spotifyAccessToken; }
    public void setSpotifyAccessToken(String spotifyAccessToken) { this.spotifyAccessToken = spotifyAccessToken; }

    @JsonIgnore
    public String getSpotifyRefreshToken() { return spotifyRefreshToken; }
    public void setSpotifyRefreshToken(String spotifyRefreshToken) { this.spotifyRefreshToken = spotifyRefreshToken; }

    @JsonIgnore
    public Instant getSpotifyExpiresAt() { return spotifyExpiresAt; }
    public void setSpotifyExpiresAt(Instant spotifyExpiresAt) { this.spotifyExpiresAt = spotifyExpiresAt; }
}
