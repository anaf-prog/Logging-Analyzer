package com.analyze.service;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.GZIPInputStream;
import org.apache.commons.io.FileUtils;
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
    public List<String> readFile(File file) throws IOException {
        if(file.getName().endsWith(".gz")) {
            return readGzip(file);
        } else {
            return readPlain(file);
        }
    }

    /**
     * Membaca file log teks biasa (non-gzip).
     */
    private List<String> readPlain(File file) throws IOException {
        return FileUtils.readLines(file, StandardCharsets.UTF_8);
    }

    /**
     * Membaca file log terkompresi gzip.
     */
    private List<String> readGzip(File file) {
        List<String> lines = new ArrayList<>();

        try (GZIPInputStream gis = new GZIPInputStream(new FileInputStream(file));
            InputStreamReader isr = new InputStreamReader(gis, StandardCharsets.UTF_8);
            BufferedReader br = new BufferedReader(isr)) {
            
            String line;
            while ((line = br.readLine()) != null) {
                lines.add(line);
            }    
        } catch (Exception e) {
            log.error("Gagal baca gzip : " + e.getMessage());
        }

        return lines;
    }
    
}
