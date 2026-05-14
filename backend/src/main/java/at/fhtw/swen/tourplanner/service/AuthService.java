package at.fhtw.swen.tourplanner.service;

import at.fhtw.swen.tourplanner.security.core.TokenPayload;
import at.fhtw.swen.tourplanner.controller.response.LoginResponse;

public interface AuthService {
    LoginResponse login(String username, String rawPassword);

    void logout(String token);

    TokenPayload parseToken(String token);
}
