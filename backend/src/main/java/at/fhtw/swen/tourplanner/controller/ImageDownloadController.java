package at.fhtw.swen.tourplanner.controller;

import at.fhtw.swen.tourplanner.security.spring.CurrentUserService;
import at.fhtw.swen.tourplanner.service.ImageService;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
public class ImageDownloadController {

    private final ImageService imageService;
    private final CurrentUserService currentUserService;

    public ImageDownloadController(ImageService imageService,
                                   CurrentUserService currentUserService) {
        this.imageService = imageService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/api/tours/{tourId}/image")
    public ResponseEntity<Resource> downloadTourImage(
            @PathVariable UUID tourId
    ) {

        UUID userId = currentUserService.getUserId();

        Resource resource = imageService.downloadTourImage(tourId, userId);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
}