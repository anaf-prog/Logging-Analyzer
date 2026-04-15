package com.analyze.controller;

import com.analyze.service.DashboardService;
import com.analyze.service.ProductMonitorConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.analyze.entity.LogError;

/**
 * Controller untuk menangani halaman dan API dashboard.
 *
 * <p>
 * Relasi komponen:
 * </p>
 * <ul>
 * <li>Menggunakan {@link DashboardService} untuk mengambil data error terbaru
 * yang akan ditampilkan di dashboard.</li>
 * <li>Menggunakan {@link ProductMonitorConfigService} untuk mengambil
 * konfigurasi monitor produk yang ditampilkan di halaman dashboard.</li>
 * </ul>
 */
@Controller
@RequestMapping("/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private ProductMonitorConfigService productMonitorConfigService;

    /**
     * Menampilkan halaman dashboard utama.
     */
    @GetMapping
    public String dashboard(Model model) {
        Page<LogError> errorPage = dashboardService.getLatestErrors(0, 10, null, null);
        model.addAttribute("latestErrors", errorPage.getContent());
        model.addAttribute("monitorConfigs", productMonitorConfigService.getAllConfigs());
        return "dashboard";
    }

    /**
     * Menyediakan endpoint API untuk mengambil daftar error terbaru.
     */
    @GetMapping("/api/latest-errors")
    @ResponseBody
    public Page<LogError> latestErrors(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "productName", required = false) String productName,
            @RequestParam(name = "search", required = false) String search) {
        // Teruskan parameter filter ke service
        return dashboardService.getLatestErrors(page, size, productName, search);
    }
}
