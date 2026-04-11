package com.analyze.service;

import com.analyze.entity.LogError;
import com.analyze.repository.LogErrorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service untuk menyediakan data ringkasan yang dibutuhkan halaman dashboard.
 *
 * <p>
 * Relasi utama: service ini mengambil data melalui {@link LogErrorRepository},
 * lalu dipakai oleh controller untuk ditampilkan ke
 * UI/API.
 * </p>
 */
@Service
public class DashboardService {

    @Autowired
    private LogErrorRepository logErrorRepository;

    /**
     * Mengambil 10 data error terbaru untuk dashboard.
     */
    public List<LogError> getLatestErrors() {
        return logErrorRepository.findTop10ByOrderByLogTimeDesc();
    }
}
