package at.fhtw.swen.tourplanner.service.impl;

import at.fhtw.swen.tourplanner.service.ImageStorageProperties;
import at.fhtw.swen.tourplanner.persistence.entity.Tour;
import at.fhtw.swen.tourplanner.persistence.repository.TourRepository;
import at.fhtw.swen.tourplanner.service.ImageService;
import at.fhtw.swen.tourplanner.service.dto.TourDto;
import at.fhtw.swen.tourplanner.service.mapper.TourMapper;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class ImageServiceImpl implements ImageService {

    private final Path basePath;
    private final TourRepository tourRepository;

    public ImageServiceImpl(ImageStorageProperties props,
                            TourRepository tourRepository) {
        this.basePath = Paths.get(props.getBaseDir());
        this.tourRepository = tourRepository;
    }

    @Override
    public TourDto uploadTourImage(UUID tourId, UUID userId, String username, MultipartFile file) {

        Tour tour = tourRepository.findByIdAndCreatedBy(tourId, userId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));

        String path = storeFile(tourId, username, file);

        tour.setImagePath(path);
        tourRepository.save(tour);

        return TourMapper.toResponse(tour);
    }

    @Override
    public Resource downloadTourImage(UUID tourId, UUID userId) {

        Tour tour = tourRepository.findByIdAndCreatedBy(tourId, userId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));

        if (tour.getImagePath() == null) {
            throw new RuntimeException("No image uploaded");
        }

        try {
            Path path = Paths.get(tour.getImagePath());

            if (!Files.exists(path)) {
                throw new RuntimeException("Image missing on disk");
            }

            return new UrlResource(path.toUri());

        } catch (Exception e) {
            throw new RuntimeException("Could not load image", e);
        }
    }

    // internal helper (was previously the whole service)
    private String storeFile(UUID tourId, String username, MultipartFile file) {
        try {
            String safeUsername = sanitizeUsername(username);
            Path userFolder = basePath.resolve(safeUsername);
            Files.createDirectories(userFolder);

            String extension = getExtension(file.getOriginalFilename());
            String filename = tourId + "." + extension;

            Path target = userFolder.resolve(filename);

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            return target.toString();

        } catch (IOException e) {
            throw new RuntimeException("Could not store image", e);
        }
    }

    private String getExtension(String name) {
        if (name == null || !name.contains(".")) return "jpg";
        return name.substring(name.lastIndexOf('.') + 1);
    }

    private String sanitizeUsername(String username) {
        return username.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}