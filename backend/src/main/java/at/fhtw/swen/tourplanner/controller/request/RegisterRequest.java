package at.fhtw.swen.tourplanner.controller.request;

public record RegisterRequest(
        String username,
        String password,
        String email
) {
}