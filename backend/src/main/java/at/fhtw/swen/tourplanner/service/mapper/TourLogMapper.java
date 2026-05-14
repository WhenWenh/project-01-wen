package at.fhtw.swen.tourplanner.service.mapper;

import at.fhtw.swen.tourplanner.service.dto.TourLogDto;
import at.fhtw.swen.tourplanner.persistence.entity.TourLog;

import java.util.List;
import java.util.UUID;

public class TourLogMapper {

    public static TourLog fromCreateRequest(UUID id, UUID userId, TourLogDto tourLogDto) {
        return new TourLog(
                id,
                tourLogDto.getTourId(),
                userId,
                tourLogDto.getDateTime(),
                tourLogDto.getRating(),
                tourLogDto.getDifficulty(),
                tourLogDto.getTotalDistance(),
                tourLogDto.getTotalTime(),
                tourLogDto.getComment()
        );
    }

    public static void updateEntity(TourLogDto dto, TourLog entity) {
        if (dto.getDateTime() != null) {
            entity.setDateTime(dto.getDateTime());
        }
        if (dto.getRating() != null) {
            entity.setRating(dto.getRating());
        }
        if (dto.getDifficulty() != null) {
            entity.setDifficulty(dto.getDifficulty());
        }
        if (dto.getTotalDistance() != null) {
            entity.setTotalDistance(dto.getTotalDistance());
        }
        if (dto.getTotalTime() != null) {
            entity.setTotalTime(dto.getTotalTime());
        }
        if (dto.getComment() != null) {
            entity.setComment(dto.getComment());
        }
    }

    public static TourLogDto toResponse(TourLog entity) {
        return new TourLogDto(
                entity.getId(),
                entity.getTourId(),
                entity.getDateTime(),
                entity.getRating(),
                entity.getDifficulty(),
                entity.getTotalDistance(),
                entity.getTotalTime(),
                entity.getComment()
        );
    }

    public static TourLogDto toListResponse(TourLog entity) {
        return new TourLogDto(
                entity.getId(),
                entity.getTourId(),
                entity.getDateTime(),
                entity.getRating(),
                entity.getDifficulty(),
                entity.getTotalDistance(),
                entity.getTotalTime(),
                entity.getComment()
        );
    }

    public static List<TourLogDto> toListResponseList(List<TourLog> entities) {
        return entities.stream().map(TourLogMapper::toListResponse).toList();
    }
}
