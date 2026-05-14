package at.fhtw.swen.tourplanner.service.dto;

import java.time.Instant;
import java.util.UUID;

public record UserDto(UUID id, String username, String passwordHash, String email, Instant createdAt) {

    public UserDto(UUID id, String username, String password, String email) {
        this(id, username, password, email, null);
    }

    public UserDto {
        if (id == null) {
            throw new IllegalArgumentException("id must not be null");
        }
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("username must not be blank");
        }
        if (passwordHash == null || passwordHash.isBlank()) {
            throw new IllegalArgumentException("password must not be blank");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("email must not be blank");
        }

    }

    public UUID getId() {
        return id;
    }
}
