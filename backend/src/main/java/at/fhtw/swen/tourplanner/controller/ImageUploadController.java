package at.fhtw.swen.tourplanner.controller;

import at.fhtw.swen.tourplanner.security.spring.CurrentUserService;
import at.fhtw.swen.tourplanner.service.ImageService;
import at.fhtw.swen.tourplanner.service.dto.TourDto;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.UUID;

@RestController
public class ImageUploadController {

    private final ImageService imageService;
    private final CurrentUserService currentUserService;

    public ImageUploadController(ImageService imageService,
                                 CurrentUserService currentUserService) {
        this.imageService = imageService;
        this.currentUserService = currentUserService;
    }

    @PostMapping(value = "/api/tours/{tourId}/image",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<TourDto> uploadTourImage(
            @PathVariable UUID tourId,
            @RequestPart("file") MultipartFile file,
            Principal principal
    ) {
        UUID userId = currentUserService.getUserId();

        TourDto dto = imageService.uploadTourImage(
                tourId,
                userId,
                principal.getName(),
                file
        );

        return ResponseEntity.ok(dto);
    }
}