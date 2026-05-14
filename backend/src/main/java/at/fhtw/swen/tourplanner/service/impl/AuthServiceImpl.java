package at.fhtw.swen.tourplanner.service.impl;

import at.fhtw.swen.tourplanner.persistence.entity.Session;
import at.fhtw.swen.tourplanner.persistence.entity.User;
import at.fhtw.swen.tourplanner.persistence.repository.SessionRepository;
import at.fhtw.swen.tourplanner.security.core.PasswordHasher;
import at.fhtw.swen.tourplanner.security.core.TokenPayload;
import at.fhtw.swen.tourplanner.security.core.TokenService;
import at.fhtw.swen.tourplanner.persistence.repository.UserRepository;
import at.fhtw.swen.tourplanner.service.AuthService;
import at.fhtw.swen.tourplanner.controller.response.LoginResponse;
import at.fhtw.swen.tourplanner.util.UUIDv7;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private final PasswordHasher passwordHasher;
    private final TokenService tokenService;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final long expirationMinutes;

    public AuthServiceImpl(
            PasswordHasher passwordHasher,
            TokenService tokenService,
            SessionRepository sessionRepository,
            UserRepository userRepository,
            @Value("${security.jwt.expiration-minutes}") long expirationMinutes
    ) {
        this.passwordHasher = passwordHasher;
        this.tokenService = tokenService;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.expirationMinutes = expirationMinutes;
    }

    @Override
    public LoginResponse login(String username, String rawPassword) {

        if (username == null || username.isBlank() ||
                rawPassword == null || rawPassword.isBlank()) {
            throw new SecurityException("Invalid credentials");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new SecurityException("Invalid credentials"));

        if (passwordHasher.invalid(rawPassword, user.getPasswordHash())) {
            throw new SecurityException("Invalid credentials");
        }

        UUID sessionId = UUIDv7.randomUUID();
        Instant expiresAt = Instant.now().plus(expirationMinutes, ChronoUnit.MINUTES);

        String token = tokenService.createToken(
                user.getId(),
                user.getUsername(),
                sessionId,
                expiresAt
        );

        Session session = new Session(
                sessionId,
                user.getId(),
                token,
                Instant.now(),
                expiresAt,
                false
        );

        sessionRepository.save(session);

        return new LoginResponse(token, expiresAt, sessionId);
    }

    @Override
    @Transactional
    public void logout(String token) {
        if (token == null || token.isBlank()) {
            throw new SecurityException("Missing token");
        }

        TokenPayload payload = tokenService.parseAndValidate(token);
        sessionRepository.revokeByJti(payload.sessionId());
    }

    @Override
    public TokenPayload parseToken(String token) {
        return tokenService.parseAndValidate(token);
    }
}