package com.analyze.service;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.function.Consumer;
import java.util.zip.GZIPInputStream;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

/**
 * Service untuk membaca isi file log menjadi daftar baris.
 *
 * <p>
 * Relasi utama: dipakai oleh {@link LogProcessorService} saat proses parsing log
 * </p>
 */
@Service
@Slf4j
public class LogReaderService {

    /**
     * Membaca file log dan memilih metode baca sesuai tipe file.
     */
    public void readFileStreaming(File file, Consumer<String> lineProcessor) throws IOException {
        if (file.getName().endsWith(".gz")) {
            readGzipStreaming(file, lineProcessor);
        } else {
            readPlainStreaming(file, lineProcessor);
        }
    }

    /**
     * Membaca file log teks biasa (non-gzip).
     */
    private void readPlainStreaming(File file, Consumer<String> lineProcessor) throws IOException {
        try (BufferedReader reader = Files.newBufferedReader(file.toPath(), StandardCharsets.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                lineProcessor.accept(line);
            }
        }
    }

    /**
     * Membaca file log terkompresi gzip.
     */
    private void readGzipStreaming(File file, Consumer<String> lineProcessor) {
        try (GZIPInputStream gis = new GZIPInputStream(new FileInputStream(file));
                InputStreamReader isr = new InputStreamReader(gis, StandardCharsets.UTF_8);
                BufferedReader br = new BufferedReader(isr)) {
            String line;
            while ((line = br.readLine()) != null) {
                lineProcessor.accept(line);
            }
        } catch (Exception e) {
            log.error("Gagal baca gzip: " + e.getMessage());
        }
    }
    
}
