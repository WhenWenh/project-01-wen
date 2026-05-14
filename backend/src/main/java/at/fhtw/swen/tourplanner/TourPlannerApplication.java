package at.fhtw.swen.tourplanner;

import at.fhtw.swen.tourplanner.service.ImageStorageProperties;
import at.fhtw.swen.tourplanner.util.LoggerService;
import org.jspecify.annotations.NonNull;
import org.slf4j.Logger;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@EnableConfigurationProperties(ImageStorageProperties.class)
@SpringBootApplication
public class TourPlannerApplication implements CommandLineRunner {

    private final Logger logger = LoggerService.getInstance().getLogger(getClass());

    static void main(String[] args) {
        SpringApplication.run(TourPlannerApplication.class, args);
    }

    @Override
    public void run(String @NonNull ... args) {
        logger.info(" ###  TourPlanner started  ### ");
    }
}