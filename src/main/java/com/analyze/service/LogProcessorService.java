package com.analyze.service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.analyze.entity.LogError;
import com.analyze.entity.ProductMonitorConfig;
import com.analyze.repository.LogErrorRepository;
import lombok.extern.slf4j.Slf4j;

/**
 * Service untuk memproses file log per produk dan menyimpan error baru.
 *
 * <p>
 * Relasi utama:
 * </p>
 * <ul>
 * <li>Menggunakan {@link LogReaderService} untuk membaca isi file log.</li>
 * <li>Menggunakan {@link LogParserService} untuk parse tiap baris menjadi
 * {@link LogError}.</li>
 * <li>Menggunakan {@link LogErrorRepository} untuk cek duplikasi dan simpan
 * data.</li>
 * </ul>
 */
@Service
@Slf4j
public class LogProcessorService {

    @Autowired
    private LogReaderService logReaderService;

    @Autowired
    private LogParserService logParserService;

    @Autowired
    private LogErrorRepository logErrorRepository;

    /**
     * Memproses satu file log berdasarkan konfigurasi produk.
     */
    public void processFile(File file, ProductMonitorConfig config) throws IOException {
        log.info("=== PROCESS FILE === " + file.getName());

        List<String> lines = logReaderService.readFile(file);
        List<LogError> result = new ArrayList<>();
        Set<String> uniqueInThisFile = new HashSet<>();

        for (String line : lines) {
            logParserService.parse(line, config).ifPresent(logError -> {

                // Cek apakah pesan ini sudah ada di database untuk produk yang sama
                boolean alreadyInDb = logErrorRepository.existsByProductNameAndMessage(
                        logError.getProductName(),
                        logError.getMessage());

                if (!alreadyInDb) {
                    // Cek apakah pesan ini duplikat di dalam file yang sama
                    if (uniqueInThisFile.add(logError.getMessage())) {
                        result.add(logError);
                    }
                }
            });
        }

        log.info("TOTAL NEW MATCH: " + result.size());

        if (!result.isEmpty()) {
            logErrorRepository.saveAll(result);
        }
    }
    
}
