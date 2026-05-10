package com.analyze.service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.analyze.entity.SSHConfig;
import com.analyze.repository.SSHConfigRepository;

@Service
public class SSHConfigService {

    @Autowired
    private SSHConfigRepository repository;

    public List<SSHConfig> getAllConfigs() {
        return repository.findAllByOrderByNameAscIdAsc();
    }

    public Optional<SSHConfig> getFirstEnabledConfig() {
        return repository.findFirstByEnabledTrueOrderByIdAsc();
    }

    @Transactional
    public SSHConfig create(String name, String host, Integer port, String username, String password, String sudoPassword,
            String logPath, boolean enabled) {
        SSHConfig config = new SSHConfig();
        applyValues(config, name, host, port, username, password, sudoPassword, logPath, enabled);
        return repository.save(config);
    }

    @Transactional
    public SSHConfig update(Long id, String name, String host, Integer port, String username, String password,
            String sudoPassword, String logPath, boolean enabled) {
        SSHConfig config = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Konfigurasi SSH tidak ditemukan: " + id));
        applyValues(config, name, host, port, username, password, sudoPassword, logPath, enabled);
        return repository.save(config);
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    private void applyValues(SSHConfig config, String name, String host, Integer port, String username, String password,
            String sudoPassword, String logPath, boolean enabled) {
        config.setName(requireValue(name, "Nama konfigurasi"));
        config.setHost(requireValue(host, "Host"));
        config.setPort(port != null && port > 0 ? port : 22);
        config.setUsername(requireValue(username, "Username"));
        config.setPassword(requireValue(password, "Password"));
        config.setSudoPassword(normalize(sudoPassword));
        config.setLogPath(requireValue(logPath, "Path log"));
        config.setEnabled(enabled);
    }

    private String requireValue(String value, String label) {
        String normalized = normalize(value);
        if (normalized == null) {
            throw new IllegalArgumentException(label + " wajib diisi");
        }
        return normalized;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
