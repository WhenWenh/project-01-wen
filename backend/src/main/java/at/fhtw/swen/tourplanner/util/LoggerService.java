package at.fhtw.swen.tourplanner.util;

/// QR-BA-05
/*
Usage (in logging class):

LoggerService logService = new LoggerService();
private final Logger logger = logService.getInstance().getLogger(getClass());

logger.info("My var is: {}", myvar);
*/

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

public final class LoggerService {

    // --- Singleton instance ---
    private static final LoggerService INSTANCE = new LoggerService();

    // --- Cache for loggers ---
    private final ConcurrentMap<Class<?>, Logger> loggers = new ConcurrentHashMap<>();

    // --- Private constructor ---
    public LoggerService() {
    }

    // --- Access point ---
    public static LoggerService getInstance() {
        return INSTANCE;
    }

    // --- Logger retrieval ---
    public Logger getLogger(Class<?> clazz) {
        return loggers.computeIfAbsent(clazz, LoggerFactory::getLogger);
    }
}