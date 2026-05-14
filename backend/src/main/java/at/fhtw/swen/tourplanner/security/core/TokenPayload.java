package at.fhtw.swen.tourplanner.security.core;

import java.time.Instant;
import java.util.UUID;

public record TokenPayload(
        UUID userId,
        String username,
        UUID sessionId,
        Instant expiresAt
) {
    public UUID uuid() {
        return userId;
    }
}