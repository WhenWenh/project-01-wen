package at.fhtw.swen.tourplanner.controller;

import at.fhtw.swen.tourplanner.controller.response.TourTypeListResponse;
import at.fhtw.swen.tourplanner.service.dto.TourDto;
import at.fhtw.swen.tourplanner.controller.response.TourListResponse;
import at.fhtw.swen.tourplanner.security.spring.JwtUserDetails;
import at.fhtw.swen.tourplanner.service.TourService;
import at.fhtw.swen.tourplanner.util.LoggerService;
import at.fhtw.swen.tourplanner.util.UUIDv7;
import org.slf4j.Logger;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tours")
public class TourController {

    private final TourService service;
    private final Logger logger;

    public TourController(TourService service) {
        this.service = service;
        this.logger = LoggerService.getInstance().getLogger(getClass());
    }

    @PostMapping
    public TourDto create(
            @RequestBody TourDto req,
            @AuthenticationPrincipal JwtUserDetails userDetails
    ) {
        UUID userId = userDetails.getUserId();
        UUID id = UUIDv7.randomUUID();

        logger.info("Create Tour called by user: {}", userId);
        return service.create(userId, req, id);
    }

    @GetMapping
    public List<TourListResponse> all(@AuthenticationPrincipal JwtUserDetails userDetails) {
        UUID userId = userDetails.getUserId();
        logger.info("Get All Tours called by user: {}", userId);
        return service.findAllByUser(userId);
    }

    @GetMapping("/favorites")
    public List<TourTypeListResponse> allFav(@AuthenticationPrincipal JwtUserDetails userDetails) {
        UUID userId = userDetails.getUserId();
        logger.info("Get All favorite Tours called by user: {}", userId);
        return service.findAllFavByUser(userId);
    }

    @GetMapping("/not-favorites")
    public List<TourTypeListResponse> allNotFav(@AuthenticationPrincipal JwtUserDetails userDetails) {
        UUID userId = userDetails.getUserId();
        logger.info("Get All not favorite Tours called by user: {}", userId);
        return service.findAllNotFavByUser(userId);
    }

    @GetMapping("/{id}")
    public Object getById(
            @PathVariable UUID id,
            @RequestParam(name = "withFavorite", defaultValue = "false") boolean withFavorite,
            @AuthenticationPrincipal JwtUserDetails userDetails
    ) {
        UUID userId = userDetails.getUserId();
        logger.info("Get Tour {} called by user {}, withFavorite={}", id, userId, withFavorite);

        if (withFavorite) {
            return service.findByIdAndUserWithFavorite(id, userId);
        } else {
            return service.findByIdAndUser(id, userId);
        }
    }

    @PutMapping("/{id}")
    public TourDto update(
            @PathVariable UUID id,
            @RequestBody TourDto req,
            @AuthenticationPrincipal JwtUserDetails userDetails
    ) {
        UUID userId = userDetails.getUserId();
        logger.info("Update Tour {} called by user {}", id, userId);
        return service.update(id, userId, req);
    }
    
    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal JwtUserDetails userDetails
    ) {
        UUID userId = userDetails.getUserId();
        logger.info("Delete Tour {} called by user {}", id, userId);
        service.deleteByUser(id, userId);
    }
}