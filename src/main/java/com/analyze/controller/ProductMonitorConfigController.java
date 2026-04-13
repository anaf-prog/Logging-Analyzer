package com.analyze.controller;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import com.analyze.entity.ProductMonitorConfig;
import com.analyze.entity.ResponseFormat;
import com.analyze.service.ProductMonitorConfigService;

/**
 * Controller REST untuk kelola konfigurasi monitor produk.
 *
 * <p>
 * Relasi utama: controller ini mendelegasikan seluruh proses bisnis ke
 * {@link ProductMonitorConfigService}.
 * </p>
 */

@RestController
@RequestMapping("/api/monitor-configs")
public class ProductMonitorConfigController {

    @Autowired
    private ProductMonitorConfigService productMonitorConfigService;

    /**
     * Mengambil semua konfigurasi monitor produk.
     */
    @GetMapping
    public List<ProductMonitorConfig> list() {
        return productMonitorConfigService.getAllConfigs();
    }

    /**
     * Membuat konfigurasi monitor produk baru.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductMonitorConfig create(@Valid @RequestBody ProductMonitorConfigRequest request) {
        return productMonitorConfigService.create(
                request.productName(),
                request.path(),
                request.responseFormat(),
                request.codeField(),
                request.rcField(),
                request.jsonPrefix(),
                request.xmlWrapperTag());
    }

    /**
     * Memperbarui konfigurasi monitor produk berdasarkan ID.
     */
    @PutMapping("/{id}")
    public ProductMonitorConfig update(@PathVariable("id") Long id, @Valid @RequestBody ProductMonitorConfigRequest request) {
        return productMonitorConfigService.update(
                id,
                request.productName(),
                request.path(),
                request.responseFormat(),
                request.codeField(),
                request.rcField(),
                request.jsonPrefix(),
                request.xmlWrapperTag());
    }

    /**
     * Menghapus konfigurasi monitor produk berdasarkan ID.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long id) {
        productMonitorConfigService.delete(id);
    }

    /**
     * DTO request untuk operasi create/update konfigurasi monitor produk.
     */
    public record ProductMonitorConfigRequest(
            @NotBlank String productName,
            @NotBlank String path,
            @NotNull ResponseFormat responseFormat,
            String codeField,
            String rcField,
            String jsonPrefix,     
            String xmlWrapperTag) {
    }
}
