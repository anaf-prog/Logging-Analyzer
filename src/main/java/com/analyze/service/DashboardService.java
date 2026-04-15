package com.analyze.service;

import com.analyze.entity.LogError;
import com.analyze.repository.LogErrorRepository;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import jakarta.persistence.criteria.Predicate;

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
    public Page<LogError> getLatestErrors(int page, int size, String productName, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("logTime").descending());
        
        Specification<LogError> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if (productName != null && !productName.isEmpty()) {
                predicates.add(cb.equal(root.get("productName"), productName));
            }
            
            if (search != null && !search.isEmpty()) {
                String likeSearch = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("message")), likeSearch),
                    cb.like(cb.lower(root.get("identifier")), likeSearch)
                ));
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        
        return logErrorRepository.findAll(spec, pageable);
    }
}
