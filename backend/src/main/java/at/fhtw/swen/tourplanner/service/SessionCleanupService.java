package at.fhtw.swen.tourplanner.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;

public interface SessionCleanupService {
    @Transactional
    @Scheduled(fixedDelayString = "${session.cleanup.fixed-delay-ms:900000}")
    void cleanupRevokedAndExpiredSessions();
}
