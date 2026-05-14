package at.fhtw.swen.tourplanner.service;

import at.fhtw.swen.tourplanner.service.dto.RouteDto;

public interface RouteServiceClient {
    RouteDto calculateRoute(String start, String end, String tourType);
}
