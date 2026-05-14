package at.fhtw.swen.tourplanner.persistence.repository;

import at.fhtw.swen.tourplanner.persistence.entity.UserFavoriteTour;
import at.fhtw.swen.tourplanner.persistence.entity.UserFavoriteTourId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Repository
public interface UserFavoriteTourRepository
        extends JpaRepository<UserFavoriteTour, UserFavoriteTourId> {

    boolean existsByUserIdAndTourId(UUID userId, UUID tourId);

    @Modifying
    @Transactional
    void deleteByUserIdAndTourId(UUID userId, UUID tourId);
}