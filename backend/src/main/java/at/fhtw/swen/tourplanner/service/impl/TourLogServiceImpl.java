package at.fhtw.swen.tourplanner.service.impl;

import at.fhtw.swen.tourplanner.service.dto.TourLogDto;
import at.fhtw.swen.tourplanner.service.mapper.TourLogMapper;
import at.fhtw.swen.tourplanner.persistence.entity.TourLog;
import at.fhtw.swen.tourplanner.persistence.repository.TourLogRepository;
import at.fhtw.swen.tourplanner.service.TourLogService;
import at.fhtw.swen.tourplanner.util.UUIDv7;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TourLogServiceImpl implements TourLogService {

    private final TourLogRepository repository;

    public TourLogServiceImpl(TourLogRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<TourLogDto> findAllByUser(UUID userId) {
        List<TourLog> logs = repository.findAllByCreatedBy(userId);
        return TourLogMapper.toListResponseList(logs);
    }

    @Override
    public TourLogDto findByIdAndUser(UUID id, UUID userId) {
        TourLog entity = repository.findByIdAndCreatedBy(id, userId)
                .orElseThrow(() -> new RuntimeException("Tour Log not found or access denied"));

        return TourLogMapper.toResponse(entity);
    }

    @Override
    public List<TourLogDto> findAllByTourAndUser(UUID tourId, UUID userId) {
        List<TourLog> logs = repository.findAllByTourIdAndCreatedBy(tourId, userId);
        return TourLogMapper.toListResponseList(logs);
    }

    @Override
    public TourLogDto create(TourLogDto req, UUID userId) {
        TourLog entity = TourLogMapper.fromCreateRequest(
                UUIDv7.randomUUID(),
                userId,
                req
        );

        repository.save(entity);
        return TourLogMapper.toResponse(entity);
    }

    @Override
    @Transactional
    public TourLogDto update(UUID id, TourLogDto req, UUID userId) {
        TourLog entity = repository.findByIdAndCreatedBy(id, userId)
                .orElseThrow(() -> new RuntimeException("Tour Log not found or access denied"));

        TourLogMapper.updateEntity(req, entity);
        return TourLogMapper.toResponse(entity);
    }

    @Override
    @Transactional
    public void deleteByUser(UUID id, UUID userId) {
        if (repository.findByIdAndCreatedBy(id, userId).isEmpty()) {
            throw new RuntimeException("Tour Log not found or access denied");
        }
        repository.deleteByIdAndCreatedBy(id, userId);
    }
}