package at.fhtw.swen.tourplanner.security.jwt;

import at.fhtw.swen.tourplanner.security.core.TokenPayload;
import at.fhtw.swen.tourplanner.security.core.TokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtTokenService implements TokenService {

    private final SecretKey secretKey;

    public JwtTokenService(@Value("${security.jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }

    @Override
    public String createToken(UUID userId, String username, UUID sessionId, Instant expiresAt) {
        Instant now = Instant.now();

        return Jwts.builder()
                .subject(username)
                .claim("uid", userId.toString())
                .id(sessionId.toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(secretKey)
                .compact();
    }

    @Override
    public TokenPayload parseAndValidate(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return new TokenPayload(
                UUID.fromString(claims.get("uid", String.class)),
                claims.getSubject(),
                UUID.fromString(claims.getId()),
                claims.getExpiration().toInstant()
        );
    }
}