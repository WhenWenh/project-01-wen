package at.fhtw.swen.tourplanner.service.impl;

import at.fhtw.swen.tourplanner.persistence.entity.Route;
import at.fhtw.swen.tourplanner.persistence.entity.Tour;
import at.fhtw.swen.tourplanner.persistence.repository.RouteRepository;
import at.fhtw.swen.tourplanner.persistence.repository.TourRepository;
import at.fhtw.swen.tourplanner.service.RouteService;
import at.fhtw.swen.tourplanner.service.RouteServiceClient;
import at.fhtw.swen.tourplanner.service.dto.RouteDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class RouteServiceImpl implements RouteService {

    private final RouteRepository routeRepository;
    private final TourRepository tourRepository;
    private final RouteServiceClient routeClient;

    public RouteServiceImpl(RouteRepository routeRepository,
                            TourRepository tourRepository,
                            RouteServiceClient routeClient) {
        this.routeRepository = routeRepository;
        this.tourRepository = tourRepository;
        this.routeClient = routeClient;
    }

    @Override
    @Transactional(readOnly = true)
    public RouteDto getRouteForTour(UUID tourId, UUID userId) {

        Tour tour = tourRepository.findByIdAndCreatedBy(tourId, userId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));

        Route route = routeRepository.findByTourId(tour.getId())
                .orElseGet(() -> {
                    RouteDto dto = routeClient.calculateRoute(
                            tour.getStartName(),
                            tour.getEndName(),
                            tour.getTourType().name()
                    );

                    Route newRoute = new Route(
                            UUID.randomUUID(),
                            tour.getId(),
                            dto.distance(),
                            dto.duration(),
                            dto.coordinates()
                    );

                    return routeRepository.save(newRoute);
                });

        return new RouteDto(
                route.getDistance(),
                route.getDuration(),
                route.getCoordinates()
        );
    }
}