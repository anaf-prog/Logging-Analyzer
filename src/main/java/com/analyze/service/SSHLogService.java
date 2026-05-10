package com.analyze.service;

import net.schmizz.sshj.connection.channel.direct.Session;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.analyze.entity.MonitorConfig;
import com.analyze.entity.SSHConfig;

import lombok.extern.slf4j.Slf4j;
import net.schmizz.sshj.SSHClient;
import net.schmizz.sshj.transport.verification.PromiscuousVerifier;

@Service
@Slf4j
public class SSHLogService {

    @Autowired
    private SSHConfigService sshConfigService;

    @Autowired
    private MonitorConfigService monitorConfigService;

    public void testConnection(String host, int port, String username, String password) {
        try (SSHClient ssh = new SSHClient()) {
            ssh.addHostKeyVerifier(new PromiscuousVerifier());
            ssh.connect(host, port);
            ssh.authPassword(username, password);

            log.info("Test koneksi ke server sukses");
        } catch (Exception e) {
            log.error("Test koneksi gagal : {}", e.getMessage());
            throw new IllegalStateException("Koneksi SSH gagal: " + e.getMessage(), e);
        }
    }

    public void startAllRemoteMonitoring() {
        List<SSHConfig> enabledConfigs = sshConfigService.getAllConfigs().stream()
                .filter(SSHConfig::isEnabled)
                .toList();
        
        if (enabledConfigs.isEmpty()) {
            log.warn("Belum ada konfigurasi SSH aktif. Remote monitoring dilewati.");
            return;
        }

        log.info("Starting remote monitoring for {} SSH configurations", enabledConfigs.size());
        
        for (SSHConfig sshConfig : enabledConfigs) {
            startMonitoringForConfig(sshConfig);
        }
    }

    public void startMonitoringForConfig(SSHConfig sshConfig) {
        List<String> logPaths = monitorConfigService.getConfigsBySshConfig(sshConfig.getId()).stream()
                .filter(MonitorConfig::isEnabled)
                .map(MonitorConfig::getLogPath)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(path -> !path.isEmpty())
                .distinct()
                .toList();

        if (logPaths.isEmpty()) {
            log.info("Tidak ada MonitorConfig aktif untuk SSH config {}. Monitoring dilewati.", sshConfig.getName());
            return;
        }

        for (String logPath : logPaths) {
            startMonitoringForConfigAndPath(sshConfig, logPath);
        }
    }

    private void startMonitoringForConfigAndPath(SSHConfig sshConfig, String logPath) {
        Thread.ofVirtual().start(() -> {
            try (SSHClient ssh = new SSHClient()) {
                ssh.addHostKeyVerifier(new PromiscuousVerifier());
                log.info("Connecting to {}:{} as {}...", sshConfig.getHost(), sshConfig.getPort(), sshConfig.getUsername());

                ssh.connect(sshConfig.getHost(), sshConfig.getPort());
                ssh.authPassword(sshConfig.getUsername(), sshConfig.getPassword());

                String tailCommand = "tail -F " + logPath;
                String command = sshConfig.getSudoPassword() != null
                        ? "echo " + sshConfig.getSudoPassword() + " | sudo -S " + tailCommand
                        : tailCommand;

                try (Session session = ssh.startSession()) {
                    final Session.Command cmd = session.exec(command);
                    log.info("Menjalankan remote tail command untuk {} path {}...", sshConfig.getName(), logPath);

                    try (BufferedReader reader = new BufferedReader(new InputStreamReader(cmd.getInputStream()))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            log.info("[REMOTE-LOG][{}][{}] {}", sshConfig.getName(), logPath, line);
                        }
                    }
                    cmd.join();
                }
            } catch (Exception e) {
                log.error("Error in Virtual Thread SSH untuk {}: {}", sshConfig.getName(), e.getMessage(), e);
            }
        });
    }

    // Keep old method for backward compatibility
    public void remoteServer() {
        startAllRemoteMonitoring();
    }
    
}
