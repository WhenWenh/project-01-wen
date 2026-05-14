package at.fhtw.swen.tourplanner.security.spring;

import java.util.UUID;

public interface CurrentUserService {
    UUID getUserId();
    String getUsername();
}