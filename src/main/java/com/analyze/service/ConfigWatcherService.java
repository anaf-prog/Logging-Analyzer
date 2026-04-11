package com.analyze.service;

import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardWatchEventKinds;
import java.nio.file.WatchEvent;
import java.nio.file.WatchKey;
import java.nio.file.WatchService;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.env.PropertiesPropertySourceLoader;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MutablePropertySources;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Service;
import com.analyze.config.LogProperties;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

/**
 * Service untuk memantau perubahan file konfigurasi dan melakukan reload saat
 * file berubah.
 *
 * <p>
 * Relasi utama:
 * </p>
 * <ul>
 * <li>Menggunakan {@link ConfigurableEnvironment} untuk memperbarui
 * {@link PropertySource} aktif.</li>
 * <li>Menggunakan {@link LogProperties} sebagai target re-bind nilai properti
 * {@code log.scanner}.</li>
 * <li>Dipakai tidak langsung oleh service lain yang membaca konfigurasi terbaru
 * melalui environment/properties.</li>
 * </ul>
 */

@Service
@Slf4j
public class ConfigWatcherService {
    
    @Autowired
    private ConfigurableEnvironment environment;

    @Autowired
    private LogProperties logProperties;

    private final YamlPropertySourceLoader yamlLoader = new YamlPropertySourceLoader();
    private final PropertiesPropertySourceLoader propertiesLoader = new PropertiesPropertySourceLoader();
    private final List<String> CONFIG_FILES = Arrays.asList("application.yml", "application.properties");

    private long lastReloadTimestamp = 0;
    private final Object reloadLock = new Object();

    /**
     * Menjalankan watcher konfigurasi setelah bean dibuat.
     *
     * <p>Fungsi ini mencari direktori konfigurasi, mendaftarkan {@link WatchService},
     * lalu memanggil {@link #reloadConfig(Path)} saat file konfigurasi berubah.</p>
     */
    @PostConstruct
    public void startWatcher() {
        ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
        executor.submit(() -> {
            try {
                List<String> searchPaths = Arrays.asList("config", ".", "src/main/resources");

                Optional<Path> watchDirOpt = searchPaths.stream()
                        .map(Paths::get)
                        .filter(dir -> CONFIG_FILES.stream().anyMatch(file -> Files.exists(dir.resolve(file))))
                        .findFirst();

                if (watchDirOpt.isEmpty()) {
                    log.warn("File konfigurasi ({}) tidak ditemukan di {}. Hot reload dinonaktifkan.", CONFIG_FILES, searchPaths);
                    return;
                }

                Path watchDir = watchDirOpt.get().toAbsolutePath();
                log.info("Hot reload aktif! Memantau perubahan di direktori: {}", watchDir);

                WatchService watchService = FileSystems.getDefault().newWatchService();
                watchDir.register(watchService, StandardWatchEventKinds.ENTRY_MODIFY);

                while (true) {
                    WatchKey key = watchService.take();
                    for (WatchEvent<?> event : key.pollEvents()) {
                        String changedFileName = event.context().toString();
                        if (CONFIG_FILES.contains(changedFileName)) {
                            reloadConfig(watchDir.resolve(changedFileName));
                        }
                    }
                    if (!key.reset())
                        break;
                }
            } catch (Exception e) {
                log.error("Error pada ConfigWatcherService", e);
            }
        });
    }

    /**
     * Memuat ulang file konfigurasi yang berubah lalu memperbarui environment aktif.
     */
    private void reloadConfig(Path path) {
        synchronized (reloadLock) {
            long now = System.currentTimeMillis();
            if (now - lastReloadTimestamp < 500) {
                log.trace("Debounce: Mengabaikan event reload tambahan.");
                return;
            }
            log.info("Terdeteksi perubahan pada {}. Memuat ulang...", path.getFileName());
            lastReloadTimestamp = now;
        }

        try {
            String fileName = path.getFileName().toString();
            List<PropertySource<?>> newSources;
            String sourceName = "external-" + fileName;

            if (fileName.endsWith(".yml") || fileName.endsWith(".yaml")) {
                newSources = yamlLoader.load(sourceName, new FileSystemResource(path));
            } else if (fileName.endsWith(".properties")) {
                newSources = propertiesLoader.load(sourceName, new FileSystemResource(path));
            } else {
                return;
            }

            if (!newSources.isEmpty()) {
                MutablePropertySources propertySources = environment.getPropertySources();
                PropertySource<?> newSource = newSources.get(0);

                if (propertySources.contains(sourceName)) {
                    propertySources.replace(sourceName, newSource);
                } else {
                    propertySources.addFirst(newSource);
                }

                if (logProperties.getPaths() != null) {
                    logProperties.getPaths().clear();
                }

                Binder.get(environment).bind("log.scanner", Bindable.ofInstance(logProperties));
                log.info("Konfigurasi dari {} berhasil diperbarui! Path baru: {}", fileName, logProperties.getPaths());
            }
        } catch (IOException e) {
            log.error("Gagal memuat ulang konfigurasi dari: {}", path, e);
        }
    }
}
