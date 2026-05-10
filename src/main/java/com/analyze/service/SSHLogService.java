package com.analyze.service;

import net.schmizz.sshj.connection.channel.direct.Session;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.analyze.entity.SSHConfig;

import lombok.extern.slf4j.Slf4j;
import net.schmizz.sshj.SSHClient;
import net.schmizz.sshj.transport.verification.PromiscuousVerifier;

@Service
@Slf4j
public class SSHLogService {

    @Autowired
    private SSHConfigService sshConfigService;

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

    public void remoteServer() {

        Optional<SSHConfig> sshConfigOptional = sshConfigService.getFirstEnabledConfig();
        if (sshConfigOptional.isEmpty()) {
            log.warn("Belum ada konfigurasi SSH aktif. Remote tail dilewati.");
            return;
        }

        SSHConfig sshConfig = sshConfigOptional.get();
        Thread.ofVirtual().start(() -> {
            try (SSHClient ssh = new SSHClient()) {
                ssh.addHostKeyVerifier(new PromiscuousVerifier());
                log.info("Connecting to {}:{} as {}...", sshConfig.getHost(), sshConfig.getPort(), sshConfig.getUsername());

                ssh.connect(sshConfig.getHost(), sshConfig.getPort());
                ssh.authPassword(sshConfig.getUsername(), sshConfig.getPassword());

                String tailCommand = "tail -F " + sshConfig.getLogPath();
                String command = sshConfig.getSudoPassword() != null
                        ? "echo " + sshConfig.getSudoPassword() + " | sudo -S " + tailCommand
                        : tailCommand;

                try (Session session = ssh.startSession()) {
                    final Session.Command cmd = session.exec(command);
                    log.info("Menjalankan remote tail command...");

                    try (BufferedReader reader = new BufferedReader(new InputStreamReader(cmd.getInputStream()))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            log.info("[REMOTE-LOG] {}", line);
                        }
                    }
                    cmd.join();
                }
            } catch (Exception e) {
                log.error("Error in Virtual Thread SSH: {}", e.getMessage(), e);
            }
        });
    }
    
}
