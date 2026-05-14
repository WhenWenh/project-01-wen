package at.fhtw.swen.tourplanner.service.dto;

import java.util.List;

/**
 * @param distance    meters
 * @param duration    seconds
 * @param coordinates [[lat,lng],[lat,lng],...]
 */
public record RouteDto(int distance, int duration, List<List<Double>> coordinates) {
}