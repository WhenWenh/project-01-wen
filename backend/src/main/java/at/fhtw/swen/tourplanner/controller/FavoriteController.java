package at.fhtw.swen.tourplanner.controller;

import at.fhtw.swen.tourplanner.security.spring.JwtUserDetails;
import at.fhtw.swen.tourplanner.service.FavoriteService;
import at.fhtw.swen.tourplanner.util.LoggerService;
import org.slf4j.Logger;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users/me/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final Logger logger = LoggerService.getInstance().getLogger(getClass());

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @PostMapping("/{tourId}")
    public ResponseEntity<Void> addFavorite(
            @PathVariable UUID tourId,
            @AuthenticationPrincipal JwtUserDetails userDetails
    ) {
        UUID userId = userDetails.getUserId();
        logger.info("Add favorite {} for user {}", tourId, userId);

        favoriteService.addFavorite(userId, tourId);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{tourId}")
    public ResponseEntity<Void> removeFavorite(
            @PathVariable UUID tourId,
            @AuthenticationPrincipal JwtUserDetails userDetails
    ) {
        UUID userId = userDetails.getUserId();
        logger.info("Remove favorite {} for user {}", tourId, userId);

        favoriteService.removeFavorite(userId, tourId);

        return ResponseEntity.noContent().build();
    }
}