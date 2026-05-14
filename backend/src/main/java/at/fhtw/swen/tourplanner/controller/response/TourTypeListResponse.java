package at.fhtw.swen.tourplanner.controller.response;

import at.fhtw.swen.tourplanner.persistence.entity.TourType;

public record TourTypeListResponse (
        String id,
        String name,
        TourType tourType
) {}