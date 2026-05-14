package at.fhtw.swen.tourplanner.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "routes")
public class Route {

    @Id
    private UUID id;

    @Column(name = "tour_id", nullable = false, unique = true)
    private UUID tourId;

    @Column(name = "distance")
    private Integer distance;

    @Column(name = "duration")
    private Integer duration;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "coordinates", columnDefinition = "jsonb")
    private List<List<Double>> coordinates;

    public Route(UUID id,
                 UUID tourId,
                 Integer distance,
                 Integer duration,
                 List<List<Double>> coordinates) {

        this.id = id;
        this.tourId = tourId;
        this.distance = distance;
        this.duration = duration;
        this.coordinates = coordinates;
    }
}