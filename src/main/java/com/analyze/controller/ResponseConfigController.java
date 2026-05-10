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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.analyze.entity.ResponseConfig;
import com.analyze.service.ResponseConfigService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@RestController
@RequestMapping("/api/response-configs")
public class ResponseConfigController {

    @Autowired
    private ResponseConfigService responseConfigService;
    
    @GetMapping
    public List<ResponseConfig> list() {
        return responseConfigService.getAllConfigs();
    }
    
    @GetMapping("/{id}")
    public ResponseConfig getById(@PathVariable Long id) {
        return responseConfigService.getConfigById(id);
    }
    
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseConfig create(@Valid @RequestBody ResponseConfigRequest request) {
        ResponseConfig config = new ResponseConfig();
        config.setName(request.name());
        config.setFormat(request.format());
        config.setTemplate(request.template());
        config.setDescription(request.description());
        return responseConfigService.create(config);
    }
    
    @PutMapping("/{id}")
    public ResponseConfig update(@PathVariable Long id, @Valid @RequestBody ResponseConfigRequest request) {
        ResponseConfig config = new ResponseConfig();
        config.setName(request.name());
        config.setFormat(request.format());
        config.setTemplate(request.template());
        config.setDescription(request.description());
        return responseConfigService.update(id, config);
    }
    
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        responseConfigService.delete(id);
    }
    
    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> testResponse(@Valid @RequestBody TestResponseRequest request) {
        try {
            Map<String, Object> testData = new HashMap<>();
            testData.put("timestamp", System.currentTimeMillis());
            testData.put("status", "success");
            testData.put("message", "Test response");
            testData.put("data", request.getSampleData());
            
            String generatedResponse = responseConfigService.generateResponse(
                request.getFormat(), 
                request.getTemplate(), 
                testData
            );
            
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
    
    public record ResponseConfigRequest(
        @NotBlank String name,
        @NotBlank String format,
        @NotBlank String template,
        String description
    ) {}
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TestResponseRequest {
        private String format;
        private String template;
        private Map<String, Object> sampleData;
    }
    
}
