package at.fhtw.swen.tourplanner.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Entity
@Table(name = "tours")
public class Tour {

    @Id
    private UUID id;

    @Column(name = "created_by")
    private UUID createdBy;

    @Setter
    private String name;
    @Setter
    private String description;

    @Setter
    @Column(name = "image_path")
    private String imagePath;

    @Setter
    @Enumerated(EnumType.STRING)
    @Column(name = "tour_type", nullable = false, length = 20)
    private TourType tourType;

    @Setter
    @Column(name = "start_name")
    private String startName;

    @Setter
    @Column(name = "end_name")
    private String endName;

    protected Tour() {}

    public Tour(UUID id,
                UUID createdBy,
                String name,
                String description,
                String imagePath,
                TourType tourType,
                String startName,
                String endName) {
        this.id = id;
        this.createdBy = createdBy;
        this.name = name;
        this.description = description;
        this.imagePath = imagePath;
        this.tourType = tourType;
        this.startName = startName;
        this.endName = endName;
    }
}