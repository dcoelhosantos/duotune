package br.com.duotune.model;

import br.com.duotune.model.enums.DuoStatus;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "duos")
public class Duo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user1_id", nullable = false)
    private User user1;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user2_id", nullable = false) // Mudei para false, pois um Duo só existe com 2 pessoas!
    private User user2;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DuoStatus status;

    @Column(name = "formed_at")
    private OffsetDateTime formedAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser1() { return user1; }
    public void setUser1(User user1) { this.user1 = user1; }
    public User getUser2() { return user2; }
    public void setUser2(User user2) { this.user2 = user2; }
    public DuoStatus getStatus() { return status; }
    public void setStatus(DuoStatus status) { this.status = status; }
    public OffsetDateTime getFormedAt() { return formedAt; }
    public void setFormedAt(OffsetDateTime formedAt) { this.formedAt = formedAt; }
}