package com.analyze.service;

import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.analyze.entity.ProductMonitorConfig;
import com.analyze.entity.ResponseFormat;
import com.analyze.repository.ProductMonitorConfigRepository;

/**
 * Service untuk mengelola konfigurasi monitor produk (CRUD).
 */
@Service
public class ProductMonitorConfigService {

    @Autowired
    private ProductMonitorConfigRepository repository;

    /**
     * Mengambil semua konfigurasi monitor produk.
     */
    public List<ProductMonitorConfig> getAllConfigs() {
        return repository.findAllByOrderByProductNameAscIdAsc();
    }

    /**
     * Mengambil konfigurasi monitor yang aktif saja.
     */
    public List<ProductMonitorConfig> getEnabledConfigs() {
        return repository.findByEnabledTrueOrderByProductNameAscIdAsc();
    }

    /**
     * Membuat konfigurasi monitor produk baru.
     */
    @Transactional
    public ProductMonitorConfig create(String productName, String path, ResponseFormat responseFormat, String codeField, String rcField, String successCodes, String jsonPrefix, String xmlWrapperTag) {
        ProductMonitorConfig config = new ProductMonitorConfig();
        applyValues(config, productName, path, responseFormat, codeField, rcField, successCodes, jsonPrefix, xmlWrapperTag);
        return repository.save(config);
    }

    /**
     * Memperbarui konfigurasi berdasarkan ID.
     */
    @Transactional
    public ProductMonitorConfig update(Long id, String productName, String path, ResponseFormat responseFormat, String codeField, String rcField, String successCodes, String jsonPrefix, String xmlWrapperTag) {
        ProductMonitorConfig config = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Config monitor tidak ditemukan: " + id));
        applyValues(config, productName, path, responseFormat, codeField, rcField, successCodes, jsonPrefix, xmlWrapperTag);
        return repository.save(config);
    }

    /**
     * Menghapus konfigurasi monitor berdasarkan ID.
     */
    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    /**
     * Menerapkan nilai input ke entitas konfigurasi.
     */
    private void applyValues(ProductMonitorConfig config, String productName, String path, ResponseFormat responseFormat, String codeField, String rcField, String successCodes, String jsonPrefix, String xmlWrapperTag) {
        config.setProductName(productName.trim());
        config.setPath(path.trim());
        config.setResponseFormat(responseFormat);
        config.setCodeField(normalizeFieldName(codeField));
        config.setRcField(normalizeFieldName(rcField));
        String normalizedSuccessCodes = normalizeFieldName(successCodes);
        config.setSuccessCodes(normalizedSuccessCodes != null ? normalizedSuccessCodes : "0000,00");
        config.setJsonPrefix(normalizeFieldName(jsonPrefix));
        config.setXmlWrapperTag(normalizeFieldName(xmlWrapperTag));
        config.setEnabled(true);
    }

    /**
     * Menormalkan nama field agar konsisten (trim dan ubah kosong menjadi null).
     */
    private String normalizeFieldName(String fieldName) {
        if (fieldName == null) {
            return null;
        }

        String trimmed = fieldName.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
