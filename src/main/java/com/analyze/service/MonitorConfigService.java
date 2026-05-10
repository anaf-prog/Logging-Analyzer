package com.analyze.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.analyze.entity.MonitorConfig;
import com.analyze.entity.ResponseFormat;
import com.analyze.entity.SSHConfig;
import com.analyze.repository.MonitorConfigRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class MonitorConfigService {

    @Autowired
    private MonitorConfigRepository monitorConfigRepository;

    @Transactional(readOnly = true)
    public List<MonitorConfig> getAllConfigs() {
        return monitorConfigRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<MonitorConfig> getEnabledConfigs() {
        return monitorConfigRepository.findByEnabledTrue();
    }

    @Transactional(readOnly = true)
    public List<MonitorConfig> getConfigsWithSshAndEnabled() {
        return monitorConfigRepository.findWithSshConfigAndEnabled();
    }

    @Transactional(readOnly = true)
    public List<MonitorConfig> getConfigsBySshConfig(Long sshConfigId) {
        return monitorConfigRepository.findBySshConfigId(sshConfigId);
    }

    @Transactional(readOnly = true)
    public List<MonitorConfig> getConfigsByFilters(String productName, Long sshConfigId) {
        return monitorConfigRepository.findByFilters(productName, sshConfigId);
    }

    @Transactional(readOnly = true)
    public Optional<MonitorConfig> getConfigById(Long id) {
        return monitorConfigRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<MonitorConfig> getEnabledConfigByProductName(String productName) {
        return monitorConfigRepository.findByProductNameAndEnabledTrue(productName);
    }

    @Transactional
    public MonitorConfig create(
            String productName,
            String logPath,
            ResponseFormat responseFormat,
            String codeField,
            String rcField,
            String successCodes,
            String jsonPrefix,
            String xmlWrapperTag,
            String responseName,
            String responseTemplate,
            String responseDescription,
            SSHConfig sshConfig) {
        
        MonitorConfig config = new MonitorConfig();
        config.setProductName(productName);
        config.setLogPath(logPath);
        config.setResponseFormat(responseFormat);
        config.setCodeField(codeField);
        config.setRcField(rcField);
        config.setSuccessCodes(successCodes != null ? successCodes : "0000,00");
        config.setJsonPrefix(jsonPrefix);
        config.setXmlWrapperTag(xmlWrapperTag);
        config.setResponseName(responseName);
        config.setResponseTemplate(responseTemplate);
        config.setResponseDescription(responseDescription);
        config.setSshConfig(sshConfig);
        config.setEnabled(true);

        MonitorConfig saved = monitorConfigRepository.save(config);
        log.info("Created new MonitorConfig: {} for product: {}", saved.getId(), productName);
        return saved;
    }

    @Transactional
    public MonitorConfig update(Long id, MonitorConfig config) {
        Optional<MonitorConfig> existingOpt = monitorConfigRepository.findById(id);
        if (existingOpt.isEmpty()) {
            throw new IllegalArgumentException("MonitorConfig not found with id: " + id);
        }

        MonitorConfig existing = existingOpt.get();
        existing.setProductName(config.getProductName());
        existing.setLogPath(config.getLogPath());
        existing.setResponseFormat(config.getResponseFormat());
        existing.setCodeField(config.getCodeField());
        existing.setRcField(config.getRcField());
        existing.setSuccessCodes(config.getSuccessCodes());
        existing.setJsonPrefix(config.getJsonPrefix());
        existing.setXmlWrapperTag(config.getXmlWrapperTag());
        existing.setResponseName(config.getResponseName());
        existing.setResponseTemplate(config.getResponseTemplate());
        existing.setResponseDescription(config.getResponseDescription());
        existing.setSshConfig(config.getSshConfig());
        existing.setEnabled(config.isEnabled());

        MonitorConfig updated = monitorConfigRepository.save(existing);
        log.info("Updated MonitorConfig: {} for product: {}", updated.getId(), updated.getProductName());
        return updated;
    }

    @Transactional
    public void delete(Long id) {
        if (!monitorConfigRepository.existsById(id)) {
            throw new IllegalArgumentException("MonitorConfig not found with id: " + id);
        }
        monitorConfigRepository.deleteById(id);
        log.info("Deleted MonitorConfig with id: {}", id);
    }

    public String generateResponse(String format, String template, Map<String, Object> data) {
        try {
            String result = template;
            
            // Simple template replacement
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                String placeholder = "{{" + entry.getKey() + "}}";
                if (result.contains(placeholder)) {
                    result = result.replace(placeholder, String.valueOf(entry.getValue()));
                }
            }
            
            // Format the result based on format type
            if ("XML".equalsIgnoreCase(format)) {
                // Basic XML formatting if needed
                if (!result.trim().startsWith("<?xml")) {
                    result = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" + result;
                }
            }
            
            return result;
        } catch (Exception e) {
            log.error("Error generating response: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate response: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<String> getDistinctProductNames() {
        return monitorConfigRepository.findDistinctProductNames();
    }
}
