package at.fhtw.swen.tourplanner.controller;

import at.fhtw.swen.tourplanner.service.RouteService;
import at.fhtw.swen.tourplanner.service.dto.RouteDto;
import at.fhtw.swen.tourplanner.security.spring.JwtUserDetails;
import at.fhtw.swen.tourplanner.util.LoggerService;
import org.slf4j.Logger;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/tours")
public class RouteController {

    private final RouteService routeService;
    private final Logger logger = LoggerService.getInstance().getLogger(getClass());

    public RouteController(RouteService routeService) {
        this.routeService = routeService;
    }

    @GetMapping("/{tourId}/route")
    public ResponseEntity<RouteDto> getRouteForTour(
            @PathVariable UUID tourId,
            @AuthenticationPrincipal JwtUserDetails userDetails
    ) {
        UUID userId = userDetails.getUserId();
        logger.info("GET /api/tours/{}/route called by user {}", tourId, userId);

        RouteDto response = routeService.getRouteForTour(tourId, userId);

        return ResponseEntity.ok(response);
    }
}