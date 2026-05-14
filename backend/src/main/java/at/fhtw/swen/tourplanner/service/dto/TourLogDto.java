package at.fhtw.swen.tourplanner.service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TourLogDto {

    private UUID id;
    private UUID tourId;
    private Instant dateTime;
    private Integer rating;
    private Integer difficulty;
    private Integer totalDistance;
    private Integer totalTime;
    private String comment;
}