package com.analyze.service;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.analyze.entity.ResponseConfig;
import com.analyze.repository.ResponseConfigRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ResponseConfigService {

    @Autowired
    private ResponseConfigRepository repository;

    @Autowired
    private ObjectMapper jsonMapper;

    public List<ResponseConfig> getAllConfigs() {
        return repository.findAllByOrderByNameAsc();
    }

    public ResponseConfig getConfigById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Response config not found: " + id));
    }

    @Transactional
    public ResponseConfig create(ResponseConfig config) {
        // Validasi template sesuai format sebelum save
        validateTemplate(config.getFormat(), config.getTemplate());
        return repository.save(config);
    }

    @Transactional
    public ResponseConfig update(Long id, ResponseConfig config) {
        ResponseConfig existing = getConfigById(id);
        existing.setName(config.getName());
        existing.setFormat(config.getFormat());
        existing.setTemplate(config.getTemplate());
        existing.setDescription(config.getDescription());
        // Validasi template baru sebelum update
        validateTemplate(existing.getFormat(), existing.getTemplate());
        return repository.save(existing);
    }
    
    /**
     * Validasi template sesuai format
     */
    private void validateTemplate(String format, String template) {
        if ("JSON".equalsIgnoreCase(format)) {
            validateJsonTemplate(template);
        } else if ("XML".equalsIgnoreCase(format)) {
            validateXmlTemplate(template);
        }
    }
    
    /**
     * Validasi JSON template (tidak perlu parsing penuh, cukup cek struktur dasar)
     */
    private void validateJsonTemplate(String template) {
        // Cek apakah template mengandung placeholder yang tidak valid di JSON
        if (template.contains("${") && !template.contains("\"${")) {
            log.warn("JSON template mungkin tidak valid: placeholder harus dalam string: \"${variable}\"");
        }
        
        // Optional: coba parse sebagai JSON (akan gagal karena placeholder, tapi biarkan)
        // Kita hanya validasi ringan karena placeholder akan diganti nanti
    }
    
    /**
     * Validasi XML template
     */
    private void validateXmlTemplate(String template) {
        // XML validasi sederhana
        if (!template.trim().startsWith("<")) {
            log.warn("XML template harus dimulai dengan tag pembuka <");
        }
        
        if (template.contains("${") && !template.contains(">${") && !template.contains("${")) {
            // Ini ok, placeholder di XML biasanya di dalam tag
        }
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    /**
     * Generate response berdasarkan template yang dibuat user
     */
    public String generateResponse(String format, String template, Map<String, Object> data) throws Exception {
        if ("JSON".equalsIgnoreCase(format)) {
            return generateJsonResponse(template, data);
        } else if ("XML".equalsIgnoreCase(format)) {
            return generateXmlResponse(template, data);
        } else {
            throw new IllegalArgumentException("Format tidak didukung: " + format);
        }
    }

    /**
     * Generate JSON response
     * PENTING: Template JSON harus valid JSON meskipun ada placeholder
     * Placeholder harus dalam string: "key": "${value}"
     */
    private String generateJsonResponse(String template, Map<String, Object> data) throws Exception {
        // Step 1: Replace semua placeholder dengan nilai sebenarnya
        String processedTemplate = replacePlaceholders(template, data);
        
        // Step 2: Validasi dan format JSON
        try {
            // Parse JSON untuk validasi
            JsonNode jsonNode = jsonMapper.readTree(processedTemplate);
            // Return dengan pretty print
            return jsonMapper.writerWithDefaultPrettyPrinter().writeValueAsString(jsonNode);
        } catch (Exception e) {
            // Jika gagal parse, return error message yang jelas
            log.error("Gagal generate JSON response: {}", e.getMessage());
            throw new Exception("Template JSON menghasilkan format tidak valid: " + e.getMessage());
        }
    }

    /**
     * Generate XML response
     * Template XML bebas, cukup replace placeholder
     */
    private String generateXmlResponse(String template, Map<String, Object> data) throws Exception {
        // Replace semua placeholder dengan nilai dari data
        String result = replacePlaceholders(template, data);
        
        // Optional: validasi XML sederhana
        if (!result.trim().startsWith("<")) {
            log.warn("Generated XML tidak dimulai dengan tag XML");
        }
        
        return result;
    }

    /**
     * Replace placeholder ${variable} dengan nilai dari map
     */
    private String replacePlaceholders(String template, Map<String, Object> data) {
        String result = template;
        
        // Replace top-level placeholders dulu
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            String placeholder = "${" + entry.getKey() + "}";
            String value = convertValueToString(entry.getValue());
            result = result.replace(placeholder, value);
        }
        
        // Support nested placeholder (contoh: ${user.name})
        result = replaceNestedPlaceholders(result, data);
        
        return result;
    }

    /**
     * Handle nested placeholder
     */
    private String replaceNestedPlaceholders(String template, Map<String, Object> data) {
        String result = template;
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\$\\{([^}]+)\\}");
        java.util.regex.Matcher matcher = pattern.matcher(result);
        
        while (matcher.find()) {
            String fullPlaceholder = matcher.group(0);
            String path = matcher.group(1);
            Object value = getValueByPath(data, path);
            if (value != null) {
                String stringValue = convertValueToString(value);
                result = result.replace(fullPlaceholder, stringValue);
            }
        }
        
        return result;
    }

    private Object getValueByPath(Map<String, Object> data, String path) {
        String[] keys = path.split("\\.");
        Object current = data;
        
        for (String key : keys) {
            if (current instanceof Map) {
                current = ((Map<?, ?>) current).get(key);
                if (current == null) return null;
            } else {
                return null;
            }
        }
        return current;
    }

    /**
     * Konversi value ke string dengan format yang tepat
     */
    private String convertValueToString(Object value) {
        if (value == null) {
            return "";
        }
        
        if (value instanceof String) {
            return (String) value;
        }
        
        if (value instanceof Number || value instanceof Boolean) {
            return String.valueOf(value);
        }
        
        if (value instanceof Map || value instanceof List) {
            try {
                return jsonMapper.writeValueAsString(value);
            } catch (Exception e) {
                return value.toString();
            }
        }
        
        return value.toString();
    }
    
}
