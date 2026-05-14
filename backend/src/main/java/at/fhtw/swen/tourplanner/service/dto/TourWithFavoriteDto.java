package at.fhtw.swen.tourplanner.service.dto;

import at.fhtw.swen.tourplanner.persistence.entity.TourType;
import lombok.Getter;

@Getter
public class TourWithFavoriteDto extends TourDto {
    private final boolean favorite;

    public TourWithFavoriteDto(
            String id,
            String name,
            String description,
            String imagePath,
            TourType tourType,
            String startName,
            String endName,
            boolean favorite
    ) {
        super(id, name, description, imagePath, tourType, startName, endName);
        this.favorite = favorite;
    }
}