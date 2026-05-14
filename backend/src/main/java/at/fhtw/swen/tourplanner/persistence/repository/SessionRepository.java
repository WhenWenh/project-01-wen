package at.fhtw.swen.tourplanner.persistence.repository;

import at.fhtw.swen.tourplanner.persistence.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface SessionRepository extends JpaRepository<Session, UUID> {

    Optional<Session> findByJti(UUID jti);

    void deleteByRevokedTrueOrExpiresAtBefore(Instant now);

    @Modifying
    @Query("""
        UPDATE Session s
        SET s.revoked = true
        WHERE s.jti = :jti
    """)
    void revokeByJti(UUID jti);
}