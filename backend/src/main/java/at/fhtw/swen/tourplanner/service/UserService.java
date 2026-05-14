package at.fhtw.swen.tourplanner.service;

import at.fhtw.swen.tourplanner.service.dto.UserDto;

import java.util.UUID;

public interface UserService {

    UserDto register(String username, String password, String email);

    default void validateCredentials(String username, String rawPassword) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("username blank");
        }
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("password blank");
        }
    }

    void deleteUser(UUID uuid);
}