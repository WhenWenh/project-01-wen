package at.fhtw.swen.tourplanner.service.impl;

import at.fhtw.swen.tourplanner.persistence.entity.UserFavoriteTour;
import at.fhtw.swen.tourplanner.persistence.repository.TourRepository;
import at.fhtw.swen.tourplanner.persistence.repository.UserFavoriteTourRepository;
import at.fhtw.swen.tourplanner.service.FavoriteService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class FavoriteServiceImpl implements FavoriteService {

    private final UserFavoriteTourRepository favoriteRepository;
    private final TourRepository tourRepository;

    public FavoriteServiceImpl(UserFavoriteTourRepository favoriteRepository,
                               TourRepository tourRepository) {
        this.favoriteRepository = favoriteRepository;
        this.tourRepository = tourRepository;
    }

    @Override
    @Transactional
    public void addFavorite(UUID userId, UUID tourId) {
        if (!tourRepository.existsById(tourId)) {
            throw new RuntimeException("Tour not found");
        }

        if (!favoriteRepository.existsByUserIdAndTourId(userId, tourId)) {
            favoriteRepository.save(new UserFavoriteTour(userId, tourId));
        }
    }

    @Override
    @Transactional
    public void removeFavorite(UUID userId, UUID tourId) {
        favoriteRepository.deleteByUserIdAndTourId(userId, tourId);
    }
}