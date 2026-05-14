package at.fhtw.swen.tourplanner.controller.request;

public record LoginRequest(
        String username,
        String password
) {
}