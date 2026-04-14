package com.analyze.service;

import com.analyze.entity.LogError;
import com.analyze.repository.LogErrorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

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
    public Page<LogError> getLatestErrors(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("logTime").descending());
        return logErrorRepository.findAll(pageable);
    }
}
