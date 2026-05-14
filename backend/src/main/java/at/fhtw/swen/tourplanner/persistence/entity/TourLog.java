package at.fhtw.swen.tourplanner.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Entity
@Table(name = "tour_logs")
public class TourLog {

    @Id
    private UUID id;

    @Column(name = "tour_id", nullable = false)
    private UUID tourId;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    // Needed for update use-case
    @Setter
    @Column(name = "date_time")
    private Instant dateTime;

    @Setter
    @Column
    private Integer rating;

    @Setter
    @Column
    private Integer difficulty;

    @Setter
    @Column
    private Integer totalDistance;

    @Setter
    @Column
    private Integer totalTime;

    @Setter
    @Column
    private String comment;

    protected TourLog() {}

    // TourLog: difficulty, total time,  ?? total distance ?? -> not from route?

    public TourLog(UUID id,
                   UUID tourId,
                   UUID createdBy,
                   Instant dateTime,
                   Integer rating,
                   Integer difficulty,
                   Integer totalDistance,
                   Integer totalTime,
                   String comment) {
        this.id = id;
        this.tourId = tourId;
        this.createdBy = createdBy;
        this.dateTime = dateTime;
        this.rating = rating;
        this.difficulty = difficulty;
        this.totalDistance = totalDistance;
        this.totalTime = totalTime;
        this.comment = comment;
    }
}