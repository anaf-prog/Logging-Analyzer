package com.analyze.service;

import java.io.File;
import java.io.IOException;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;

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

    // Simpan tiap 500 baris error
    private static final int BATCH_SIZE = 500;

    public void processFile(File file, ProductMonitorConfig config) throws IOException {
        log.info("=== STREAMING PROCESS === " + file.getName());

        Map<String, LogError> batchBuffer = new LinkedHashMap<>();

        logReaderService.readFileStreaming(file, line -> {
            logParserService.parse(line, config).ifPresent(logError -> {
                batchBuffer.put(logError.getMessageHash(), logError);

                // Jika buffer penuh, simpan ke DB dan kosongkan buffer
                if (batchBuffer.size() >= BATCH_SIZE) {
                    saveBatch(batchBuffer.values());
                    batchBuffer.clear();
                }
            });
        });

        // Simpan sisa data yang ada di buffer
        if (!batchBuffer.isEmpty()) {
            saveBatch(batchBuffer.values());
        }
    }

    private void saveBatch(Collection<LogError> errors) {
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
            log.info("Sukses simpan data error");
        } catch (Exception e) {
            log.error("Gagal simpan batch: " + e.getMessage());
        }
    }
    
}
