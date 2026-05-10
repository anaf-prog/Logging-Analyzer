package com.analyze.service;

import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.analyze.entity.LogError;
import com.analyze.entity.ProductMonitorConfig;
import com.analyze.repository.LogErrorRepository;

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

    @Autowired
    private LogParserService logParserService;

    @Autowired
    private LogErrorRepository logErrorRepository;

    private final Map<String, Long> fileOffsets = new ConcurrentHashMap<>();
    private final Set<String> processedGzFiles = new HashSet<>();
    private static final int BATCH_SIZE = 500;

    @Scheduled(fixedDelay = 5000)
    public void scanAndProcess() {
        List<ProductMonitorConfig> configs = productMonitorConfigService.getEnabledConfigs();

        for (ProductMonitorConfig config : configs) {
            Path dirPath = Paths.get(config.getPath());
            if (!Files.exists(dirPath))
                continue;

            try (Stream<Path> paths = Files.list(dirPath)) {
                paths.filter(Files::isRegularFile)
                        .filter(this::isLogFile)
                        .forEach(path -> handleFile(path, config));
            } catch (IOException e) {
                log.error("Error scanning: " + dirPath, e);
            }
        }
    }

    private void handleFile(Path path, ProductMonitorConfig config) {
        String fileName = path.getFileName().toString();
        try {
            if (fileName.endsWith(".gz")) {
                processGzip(path, config); // File GZ tetap diproses sekali saja
            } else if (fileName.endsWith(".log")) {
                processActiveLogWithOffset(path, config);
            }
        } catch (Exception e) {
            log.error("Failed processing file: " + fileName, e);
        }
    }

    /**
     * Memproses file .log secara efisien menggunakan Byte Offset (Seeking).
     * Tidak akan pernah membaca ulang data yang sudah diproses sebelumnya.
     */
    private void processActiveLogWithOffset(Path path, ProductMonitorConfig config) throws IOException {
        String fileKey = config.getId() + ":" + path.toAbsolutePath();
        File file = path.toFile();
        long currentFileSize = file.length();
        long lastPosition = fileOffsets.getOrDefault(fileKey, 0L);

        if (currentFileSize < lastPosition) {
            log.info("LOG ROLLING DETECTED for {}. Resetting offset.", path.getFileName());
            lastPosition = 0;
        }

        if (currentFileSize == lastPosition) return;

        log.info("READING NEW DATA in {} from byte {}", path.getFileName(), lastPosition);

        try (RandomAccessFile raf = new RandomAccessFile(file, "r")) {
            raf.seek(lastPosition);

            String line;
            Map<String, LogError> batchBuffer = new LinkedHashMap<>();

            while ((line = raf.readLine()) != null) {
                String decodedLine = new String(line.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);

                logParserService.parse(decodedLine, config).ifPresent(logError -> {

                    batchBuffer.put(logError.getMessageHash(), logError);

                    if (batchBuffer.size() >= BATCH_SIZE) {
                        saveBatchSafely(batchBuffer.values());
                        batchBuffer.clear();
                    }
                });
            }

            // Simpan sisa data
            if (!batchBuffer.isEmpty()) {
                saveBatchSafely(batchBuffer.values());
            }

            fileOffsets.put(fileKey, raf.getFilePointer());
        }
    }

    private void saveBatchSafely(Collection<LogError> errors) {
        try {
            for (LogError error : errors) {
                logErrorRepository.insertIgnore(
                        error.getProductName(),
                        error.getLevel(),
                        error.getLogTime(),
                        error.getMessage(),
                        error.getIdentifier(),
                        error.getMessageHash(),
                        error.getCreatedAt() != null ? error.getCreatedAt() : java.time.LocalDateTime.now());
            }
            log.info("Sukses simpan data error ");
        } catch (Exception e) {
            log.error("Gagal simpan batch karena error lain: {}", e.getMessage());
        }
    }

    private void processGzip(Path path, ProductMonitorConfig config) throws IOException {
        String fullPath = config.getId() + ":" + path.toAbsolutePath();
        if (processedGzFiles.contains(fullPath))
            return;

        logProcessorService.processFile(path.toFile(), config);
        processedGzFiles.add(fullPath);
    }

    private boolean isLogFile(Path path) {
        String name = path.getFileName().toString().toLowerCase();
        return name.endsWith(".log") || name.endsWith(".gz");
    }
    
}
