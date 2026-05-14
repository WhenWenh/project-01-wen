package at.fhtw.swen.tourplanner.persistence.repository;

import at.fhtw.swen.tourplanner.persistence.entity.TourLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TourLogRepository extends JpaRepository<TourLog, UUID> {

    // Find all tour logs for a specific tour
    List<TourLog> findByTourId(UUID tourId);

    // Find all tour logs created by a specific user
    List<TourLog> findAllByCreatedBy(UUID userId);

    // Find a specific tour log by ID and user (for access control)
    Optional<TourLog> findByIdAndCreatedBy(UUID id, UUID userId);

    // Find all tour logs for a given tour created by a given user
    List<TourLog> findAllByTourIdAndCreatedBy(UUID tourId, UUID createdBy);

    // Delete a specific tour log by ID and user
    void deleteByIdAndCreatedBy(UUID id, UUID userId);
}