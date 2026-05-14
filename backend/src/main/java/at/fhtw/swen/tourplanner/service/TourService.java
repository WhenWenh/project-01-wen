package at.fhtw.swen.tourplanner.service;

import at.fhtw.swen.tourplanner.controller.response.TourTypeListResponse;
import at.fhtw.swen.tourplanner.service.dto.TourDto;
import at.fhtw.swen.tourplanner.controller.response.TourListResponse;
import at.fhtw.swen.tourplanner.service.dto.TourWithFavoriteDto;

import java.util.List;
import java.util.UUID;

public interface TourService {
    TourDto create(UUID userId, TourDto tourDto, UUID id);

    List<TourListResponse> findAllByUser(UUID userId);

    List<TourTypeListResponse> findAllFavByUser(UUID userId);

    List<TourTypeListResponse> findAllNotFavByUser(UUID userId);

    TourDto findByIdAndUser(UUID id, UUID userId);

    TourWithFavoriteDto findByIdAndUserWithFavorite(UUID tourId, UUID userId);

    TourDto update(UUID id, UUID userId, TourDto tourDto);

    void deleteByUser(UUID id, UUID userId);
}
