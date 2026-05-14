package at.fhtw.swen.tourplanner.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;

import java.util.UUID;

@Getter
@Entity
@Table(name = "user_favorite_tours")
@IdClass(UserFavoriteTourId.class)
public class UserFavoriteTour {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(name = "tour_id")
    private UUID tourId;

    public UserFavoriteTour() { }

    public UserFavoriteTour(UUID userId, UUID tourId) {
        this.userId = userId;
        this.tourId = tourId;
    }
}