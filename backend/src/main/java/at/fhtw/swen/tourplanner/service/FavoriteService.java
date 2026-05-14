package at.fhtw.swen.tourplanner.service;

import java.util.UUID;

public interface FavoriteService {
    void addFavorite(UUID userId, UUID tourId);
    void removeFavorite(UUID userId, UUID tourId);
}