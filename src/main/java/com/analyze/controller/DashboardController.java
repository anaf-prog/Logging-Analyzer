package com.analyze.controller;

import com.analyze.service.DashboardService;
import com.analyze.service.MonitorConfigService;
import com.analyze.service.SSHConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.analyze.entity.LogError;
import com.analyze.entity.MonitorConfig;
import com.analyze.entity.SSHConfig;
import java.util.List;

/**
 * Controller untuk menangani halaman dan API dashboard.
 *
 * <p>
 * Relasi komponen:
 * </p>
 * <ul>
 * <li>Menggunakan {@link DashboardService} untuk mengambil data error terbaru
 * yang akan ditampilkan di dashboard.</li>
 * <li>Menggunakan {@link MonitorConfigService} untuk mengambil
 * konfigurasi monitor produk yang ditampilkan di halaman dashboard.</li>
 * <li>Menggunakan {@link SSHConfigService} untuk mengambil
 * daftar server SSH yang tersedia.</li>
 * </ul>
 */
@Controller
@RequestMapping("/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private MonitorConfigService monitorConfigService;

    @Autowired
    private SSHConfigService sshConfigService;

    /**
     * Menampilkan halaman dashboard utama.
     */
    @GetMapping
    public String dashboard(Model model) {
        Page<LogError> errorPage = dashboardService.getLatestErrors(0, 10, null, null);
        List<MonitorConfig> monitorConfigs = monitorConfigService.getAllConfigs();
        List<SSHConfig> sshConfigs = sshConfigService.getAllConfigs();
        
        model.addAttribute("latestErrors", errorPage.getContent());
        model.addAttribute("monitorConfigs", monitorConfigs);
        model.addAttribute("sshConfigs", sshConfigs);
        model.addAttribute("productNames", monitorConfigService.getDistinctProductNames());
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
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "sshConfigId", required = false) Long sshConfigId) {
        // Teruskan parameter filter ke service
        return dashboardService.getLatestErrors(page, size, productName, search);
    }

    /**
     * Menyediakan endpoint API untuk mengambil daftar konfigurasi monitor dengan filter.
     */
    @GetMapping("/api/monitor-configs")
    @ResponseBody
    public List<MonitorConfig> getMonitorConfigs(
            @RequestParam(name = "productName", required = false) String productName,
            @RequestParam(name = "sshConfigId", required = false) Long sshConfigId) {
        return monitorConfigService.getConfigsByFilters(productName, sshConfigId);
    }

    /**
     * Menyediakan endpoint API untuk mengambil daftar server SSH.
     */
    @GetMapping("/api/ssh-configs")
    @ResponseBody
    public List<SSHConfig> getSshConfigs() {
        return sshConfigService.getAllConfigs();
    }
}
