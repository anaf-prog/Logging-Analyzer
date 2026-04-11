package com.analyze.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import lombok.Data;

@Component
@ConfigurationProperties(prefix = "log.scanner")
@Data
public class LogProperties {
    private List<String> paths;
}
