package at.fhtw.swen.tourplanner.service;

import at.fhtw.swen.tourplanner.service.dto.RouteDto;

import java.util.UUID;

public interface RouteService {
    RouteDto getRouteForTour(UUID tourId, UUID userId);
}