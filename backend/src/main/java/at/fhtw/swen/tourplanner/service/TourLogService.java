package at.fhtw.swen.tourplanner.service;

import at.fhtw.swen.tourplanner.service.dto.TourLogDto;

import java.util.List;
import java.util.UUID;

public interface TourLogService {

    List<TourLogDto> findAllByUser(UUID userId);

    TourLogDto findByIdAndUser(UUID id, UUID userId);

    List<TourLogDto> findAllByTourAndUser(UUID tourId, UUID userId);

    TourLogDto create(TourLogDto req, UUID userId);

    TourLogDto update(UUID id, TourLogDto req, UUID userId);

    void deleteByUser(UUID id, UUID userId);
}
