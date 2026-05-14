package at.fhtw.swen.tourplanner.security.core;

public interface PasswordHasher {
    String hash(String rawPassword);
    boolean invalid(String rawPassword, String hashedPassword);
}
