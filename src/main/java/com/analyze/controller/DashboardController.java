package com.analyze.controller;

import com.analyze.service.DashboardService;
import com.analyze.service.ProductMonitorConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import com.analyze.entity.LogError;
import java.util.List;

@Controller
@RequestMapping("/dashboard")
/**
 * Controller untuk menangani halaman dan API dashboard.
 *
 * <p>Relasi komponen:</p>
 * <ul>
 *   <li>Menggunakan {@link DashboardService} untuk mengambil data error terbaru yang akan ditampilkan di dashboard.</li>
 *   <li>Menggunakan {@link ProductMonitorConfigService} untuk mengambil konfigurasi monitor produk yang ditampilkan di halaman dashboard.</li>
 * </ul>
 */
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
        model.addAttribute("latestErrors", dashboardService.getLatestErrors());
        model.addAttribute("monitorConfigs", productMonitorConfigService.getAllConfigs());
        return "dashboard"; // Ini akan me-resolve ke src/main/resources/templates/dashboard.html
    }

    /**
     * Menyediakan endpoint API untuk mengambil daftar error terbaru.
     */
    @GetMapping("/api/latest-errors")
    @ResponseBody
    public List<LogError> latestErrors() {
        return dashboardService.getLatestErrors();
    }
}
