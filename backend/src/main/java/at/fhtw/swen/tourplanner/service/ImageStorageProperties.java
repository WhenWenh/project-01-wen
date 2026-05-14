package at.fhtw.swen.tourplanner.service;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Setter
@Getter
@ConfigurationProperties(prefix = "tour-planner.image")
public class ImageStorageProperties {

    private String baseDir;

}