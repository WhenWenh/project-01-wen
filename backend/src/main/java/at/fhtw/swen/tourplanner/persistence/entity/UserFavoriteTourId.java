package at.fhtw.swen.tourplanner.persistence.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class UserFavoriteTourId implements Serializable {

    private UUID userId;
    private UUID tourId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserFavoriteTourId that)) return false;
        return Objects.equals(userId, that.userId)
                && Objects.equals(tourId, that.tourId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, tourId);
    }
}