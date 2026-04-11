package com.analyze.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.analyze.entity.ProductMonitorConfig;
import lombok.extern.slf4j.Slf4j;

/**
 * Service untuk scan folder log berdasarkan konfigurasi produk lalu memproses file.
 */
@Service
@Slf4j
public class LogScannerService {

    @Autowired
    private LogProcessorService logProcessorService;

    @Autowired
    private ProductMonitorConfigService productMonitorConfigService;

    private Set<String> processedGzFiles = new HashSet<>();

    /**
     * Melakukan scanning seluruh folder pada konfigurasi aktif lalu memproses file log.
     */
    public void scanAndProcess() {

        log.info("============= Start Scanning Folder ================");
        
        List<ProductMonitorConfig> configs = productMonitorConfigService.getEnabledConfigs();

        log.info("Configured monitor count: " + configs.size());

        for (ProductMonitorConfig config : configs) {
            String pathStr = config.getPath();

            log.info("Scanning folder : {} for product {} ({})",
                    pathStr,
                    config.getProductName(),
                    config.getResponseFormat());

            Path dirPath = Paths.get(pathStr);

            if (!Files.exists(dirPath) || !Files.isDirectory(dirPath)) {
                log.error("Invalid directory: " + dirPath);
                continue;
            }

            try (Stream<Path> paths = Files.list(dirPath)) {

                paths
                    .filter(Files::isRegularFile)
                    .filter(this::isLogFile)
                    .sorted(Comparator.comparingLong(p -> p.toFile().lastModified()))
                    .forEach(path -> handleFile(path, config));

            } catch (IOException e) {
                log.error("Error scanning directory: " + dirPath);
                e.printStackTrace();
            }
        }
    }

    /**
     * Menentukan alur pemrosesan file berdasarkan ekstensi.
     */
    private void handleFile(Path path, ProductMonitorConfig config) {
        String fileName = path.getFileName().toString();

        log.info("Handling file : " + fileName);

        try {

            if (fileName.endsWith(".gz")) {
                processGzip(path, config);
            } else if (fileName.endsWith(".log")) {
                processActiveLog(path, config);
            }

        } catch (Exception e) {
            System.err.println("Failed processing file: " + fileName);
            e.printStackTrace();
        }
    }

    /**
     * Memproses file gzip sekali saja per kombinasi produk+path.
     */
    private void processGzip(Path path, ProductMonitorConfig config) throws IOException {
        String fullPath = config.getId() + ":" + path.toAbsolutePath();

        if (processedGzFiles.contains(fullPath)) {
            log.info("SKIP (already processed gz): " + fullPath);
            return;
        }

        log.info("PROCESS GZ: " + fullPath);

        logProcessorService.processFile(path.toFile(), config);
        processedGzFiles.add(fullPath);
    }

    /**
     * Memproses file log aktif (.log).
     */
    private void processActiveLog(Path path, ProductMonitorConfig config) throws IOException {
        log.info("PROCESS LOG: " + path);
        logProcessorService.processFile(path.toFile(), config);
    }

    /**
     * Validasi apakah file termasuk tipe log yang didukung.
     */
    private boolean isLogFile(Path path) {
        String name = path.getFileName().toString().toLowerCase();
        return name.endsWith(".log") || name.endsWith(".gz");
    }
    
}
