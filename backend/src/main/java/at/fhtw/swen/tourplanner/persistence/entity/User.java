package at.fhtw.swen.tourplanner.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Entity
@Table(name = "users")
public class User {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 64)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 256)
    private String passwordHash;

    @Column(length = 255)
    private String email;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected User() {
    }

    public User(UUID id, String username, String passwordHash, String email, Instant createdAt) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.email = email;
        this.createdAt = createdAt;
    }
}