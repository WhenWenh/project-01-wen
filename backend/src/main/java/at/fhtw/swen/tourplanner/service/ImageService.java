package at.fhtw.swen.tourplanner.service;

import at.fhtw.swen.tourplanner.service.dto.TourDto;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface ImageService {

    TourDto uploadTourImage(UUID tourId, UUID userId, String username, MultipartFile file);

    Resource downloadTourImage(UUID tourId, UUID userId);
}