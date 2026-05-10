package com.analyze.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.analyze.entity.MonitorConfig;
import com.analyze.entity.ResponseFormat;
import com.analyze.entity.SSHConfig;
import com.analyze.service.MonitorConfigService;
import com.analyze.service.SSHConfigService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@RestController
@RequestMapping("/api/monitor-configs")
public class MonitorConfigController {

    @Autowired
    private MonitorConfigService monitorConfigService;

    @Autowired
    private SSHConfigService sshConfigService;

    @GetMapping
    public List<MonitorConfig> list() {
        return monitorConfigService.getAllConfigs();
    }

    @GetMapping("/enabled")
    public List<MonitorConfig> listEnabled() {
        return monitorConfigService.getEnabledConfigs();
    }

    @GetMapping("/with-ssh")
    public List<MonitorConfig> listWithSshAndEnabled() {
        return monitorConfigService.getConfigsWithSshAndEnabled();
    }

    @GetMapping("/by-ssh/{sshConfigId}")
    public List<MonitorConfig> listBySshConfig(@PathVariable Long sshConfigId) {
        return monitorConfigService.getConfigsBySshConfig(sshConfigId);
    }

    @GetMapping("/filter")
    public List<MonitorConfig> filter(
            @RequestParam(required = false) String productName,
            @RequestParam(required = false) Long sshConfigId) {
        return monitorConfigService.getConfigsByFilters(productName, sshConfigId);
    }

    @GetMapping("/{id}")
    public MonitorConfig getById(@PathVariable Long id) {
        return monitorConfigService.getConfigById(id)
                .orElseThrow(() -> new IllegalArgumentException("MonitorConfig not found: " + id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MonitorConfig create(@Valid @RequestBody MonitorConfigRequest request) {
        SSHConfig sshConfig = null;
        if (request.sshConfigId() != null) {
            sshConfig = sshConfigService.getConfigById(request.sshConfigId())
                    .orElseThrow(() -> new IllegalArgumentException("SSHConfig not found: " + request.sshConfigId()));
        }

        return monitorConfigService.create(
                request.productName(),
                request.logPath(),
                request.responseFormat(),
                request.codeField(),
                request.rcField(),
                request.successCodes(),
                request.jsonPrefix(),
                request.xmlWrapperTag(),
                request.responseName(),
                request.responseTemplate(),
                request.responseDescription(),
                sshConfig);
    }

    @PutMapping("/{id}")
    public MonitorConfig update(@PathVariable Long id, @Valid @RequestBody MonitorConfigRequest request) {
        monitorConfigService.getConfigById(id)
                .orElseThrow(() -> new IllegalArgumentException("MonitorConfig not found: " + id));

        SSHConfig sshConfig = null;
        if (request.sshConfigId() != null) {
            sshConfig = sshConfigService.getConfigById(request.sshConfigId())
                    .orElseThrow(() -> new IllegalArgumentException("SSHConfig not found: " + request.sshConfigId()));
        }

        MonitorConfig updatedConfig = new MonitorConfig();
        updatedConfig.setProductName(request.productName());
        updatedConfig.setLogPath(request.logPath());
        updatedConfig.setResponseFormat(request.responseFormat());
        updatedConfig.setCodeField(request.codeField());
        updatedConfig.setRcField(request.rcField());
        updatedConfig.setSuccessCodes(request.successCodes());
        updatedConfig.setJsonPrefix(request.jsonPrefix());
        updatedConfig.setXmlWrapperTag(request.xmlWrapperTag());
        updatedConfig.setResponseName(request.responseName());
        updatedConfig.setResponseTemplate(request.responseTemplate());
        updatedConfig.setResponseDescription(request.responseDescription());
        updatedConfig.setSshConfig(sshConfig);
        updatedConfig.setEnabled(request.enabled());

        return monitorConfigService.update(id, updatedConfig);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        monitorConfigService.delete(id);
    }

    @PostMapping("/test-response")
    public ResponseEntity<Map<String, Object>> testResponse(@Valid @RequestBody TestResponseRequest request) {
        try {
            Map<String, Object> testData = new HashMap<>();
            testData.put("timestamp", System.currentTimeMillis());
            testData.put("status", "success");
            testData.put("message", "Test response");
            testData.put("data", request.getSampleData());

            String generatedResponse = monitorConfigService.generateResponse(
                    request.getFormat(),
                    request.getTemplate(),
                    testData);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("generatedResponse", generatedResponse);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/product-names")
    public List<String> getProductNames() {
        return monitorConfigService.getDistinctProductNames();
    }

    public record MonitorConfigRequest(
            @NotBlank String productName,
            @NotBlank String logPath,
            @NotNull ResponseFormat responseFormat,
            String codeField,
            String rcField,
            String successCodes,
            String jsonPrefix,
            String xmlWrapperTag,
            @NotBlank String responseName,
            @NotBlank String responseTemplate,
            String responseDescription,
            Long sshConfigId,
            boolean enabled) {
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TestResponseRequest {
        private String format;
        private String template;
        private Map<String, Object> sampleData;
    }
}
