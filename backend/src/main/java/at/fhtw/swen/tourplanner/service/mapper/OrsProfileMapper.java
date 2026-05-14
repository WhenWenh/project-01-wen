package at.fhtw.swen.tourplanner.service.mapper;

import at.fhtw.swen.tourplanner.persistence.entity.TourType;

public final class OrsProfileMapper {

    private OrsProfileMapper() {}

    public static String toOrsProfile(TourType type) {
        return switch (type) {
            case BIKE -> "cycling-regular";
            case HIKE -> "foot-hiking";
            case RUNNING -> "foot-walking";
            case VACATION -> "driving-car";
        };
    }
}