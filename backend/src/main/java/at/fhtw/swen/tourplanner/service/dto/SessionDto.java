package at.fhtw.swen.tourplanner.service.dto;

import java.time.Instant;
import java.util.UUID;

public record SessionDto(UUID jti, UUID userId, String token, Instant issuedAt, Instant expiresAt, boolean revoked) {
}