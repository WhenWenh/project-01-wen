package at.fhtw.swen.tourplanner.persistence.repository;

import at.fhtw.swen.tourplanner.persistence.entity.Tour;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TourRepository extends JpaRepository<Tour, UUID> {

    // find all tours created by a user
    List<Tour> findAllByCreatedBy(UUID createdBy);

    // find a specific tour by id and user
    Optional<Tour> findByIdAndCreatedBy(UUID id, UUID createdBy);

    // delete a tour by id and user
    void deleteByIdAndCreatedBy(UUID id, UUID createdBy);

    @Query("""
    SELECT t
    FROM Tour t
    WHERE t.createdBy = :userId
      AND EXISTS (
          SELECT 1
          FROM UserFavoriteTour uft
          WHERE uft.tourId = t.id
            AND uft.userId = :userId
      )
""")
    List<Tour> findAllCreatedAndFavoritesBy(UUID userId);

    @Query("""
    SELECT t
    FROM Tour t
    WHERE t.createdBy = :userId
      AND NOT EXISTS (
          SELECT 1
          FROM UserFavoriteTour uft
          WHERE uft.tourId = t.id
            AND uft.userId = :userId
      )
""")
    List<Tour> findAllCreatedButNotFavoritesBy(UUID userId);
}