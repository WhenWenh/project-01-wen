package at.fhtw.swen.tourplanner.security.jwt;

import at.fhtw.swen.tourplanner.persistence.entity.Session;
import at.fhtw.swen.tourplanner.persistence.repository.SessionRepository;
import at.fhtw.swen.tourplanner.security.spring.JwtUserDetails;
import at.fhtw.swen.tourplanner.security.core.TokenPayload;
import at.fhtw.swen.tourplanner.security.core.TokenService;
import at.fhtw.swen.tourplanner.util.LoggerService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.slf4j.Logger;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final TokenService tokenService;
    private final SessionRepository sessionRepository;
    private final Logger logger = LoggerService.getInstance().getLogger(getClass());

    public JwtAuthenticationFilter(TokenService tokenService,
                                   SessionRepository sessionRepository) {
        this.tokenService = tokenService;
        this.sessionRepository = sessionRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        logger.info("Incoming request: {} {}", request.getMethod(), request.getRequestURI());
        logger.info("Authorization header: {}", header);

        if (header == null || !header.startsWith("Bearer ")) {
            SecurityContextHolder.clearContext();
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        try {
            TokenPayload tokenPayload = tokenService.parseAndValidate(token);

            Optional<Session> optionalSession =
                    sessionRepository.findByJti(tokenPayload.sessionId());

            if (optionalSession.isEmpty()) {
                SecurityContextHolder.clearContext();
                filterChain.doFilter(request, response);
                return;
            }

            Session session = optionalSession.get();

            boolean valid =
                    !session.isRevoked()
                            && session.getExpiresAt().isAfter(Instant.now())
                            && session.getToken().equals(token);

            if (!valid) {
                SecurityContextHolder.clearContext();
                filterChain.doFilter(request, response);
                return;
            }

            UserDetails userDetails =
                    new JwtUserDetails(
                            tokenPayload.uuid(),
                            tokenPayload.username()
                    );

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            logger.info("User {} authenticated successfully", tokenPayload.username());

        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            logger.warn("JWT authentication failed: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}