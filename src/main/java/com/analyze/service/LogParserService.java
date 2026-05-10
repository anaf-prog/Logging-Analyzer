package com.analyze.service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import com.analyze.entity.LogError;
import com.analyze.entity.MonitorConfig;
import com.analyze.entity.ResponseFormat;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import lombok.extern.slf4j.Slf4j;
import java.security.MessageDigest;

/**
 * Service untuk parsing baris log menjadi objek error.
 *
 * <p>
 * Relasi: memakai {@link MonitorConfig} sebagai aturan parsing,
 * menggunakan parser JSON/XML, lalu menghasilkan {@link LogError} untuk proses
 * lanjutan.
 * </p>
 */
@Service
@Slf4j
public class LogParserService {

    private ObjectMapper objectMapper = new ObjectMapper();
    private XmlMapper xmlMapper = new XmlMapper();
    
    /**
     * Parse satu baris log sesuai konfigurasi produk.
     */
    public Optional<LogError> parse(String line, MonitorConfig config) {

        try {
            String payload = extractPayload(line, config);

            if (payload == null) {
                return Optional.empty();
            }

            log.debug("Payload yang akan di-parse: {}", payload);

            JsonNode payloadNode = readPayload(payload, config.getResponseFormat());

            String codeValue = readConfiguredValue(payloadNode, config.getCodeField(), "code");
            String rcValue = readConfiguredValue(payloadNode, config.getRcField(), "rc");
            String status = firstNonBlank(codeValue, rcValue, findTextIgnoreCase(payloadNode, "Status"));
            String errorMessage = findTextIgnoreCase(payloadNode, "ErrorMessage");

            if (!hasDecisionField(config, codeValue, rcValue, status)) {
                return Optional.empty();
            }

            if (isSuccess(config, codeValue, rcValue, status)) {
                return Optional.empty();
            }

            LogError logError = new LogError();
            logError.setLevel("ERROR");
            logError.setMessage(payload);
            logError.setLogTime(extractTimestamp(line));
            logError.setProductName(config.getProductName());
            logError.setMessageHash(generateHash(payload + config.getProductName()));

            String stanValue = findTextIgnoreCase(payloadNode, "stan");
            if (!stanValue.isBlank()) {
                logError.setIdentifier(stanValue);
            } else {
                logError.setIdentifier(extractIdentifier(line));
            }
            

            log.debug("""
                    ========== ERROR PAYMENT ==========
                    IDENTIFIER   : {}
                    STATUS       : {}
                    CODE         : {}
                    RC           : {}
                    ERROR MSG    : {}
                    PRODUCT      : {}
                    FULL RESPONSE: {}
                    ==================================
                    """,
                    logError.getIdentifier(),
                    status,
                    codeValue,
                    rcValue,
                    errorMessage,
                    config.getProductName(),
                    payload);

            return Optional.of(logError);

        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            // Jika error karena format JSON nggak standar, jangan log ERROR, cukup DEBUG
            if (msg.contains("Unexpected character") || msg.contains("Unexpected EOF") || msg.contains("prolog")) {
                log.debug("Skip baris karena bukan format JSON/XML yang valid: {}", line);
            } else {
                // Ini error sistem
                log.error("SYSTEM PARSE ERROR: {}", e.getMessage());
            }
            return Optional.empty();
        }
    }

    private String generateHash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();

        } catch (Exception e) {
            return String.valueOf(input.hashCode());
        }
    }

    /**
     * Ambil timestamp dari baris log.
     */
    private LocalDateTime extractTimestamp(String line) {
        try {
            // Cek format (2026-04-11 01:22:15)
            if (line.length() >= 19 && Character.isDigit(line.charAt(0)) && line.charAt(4) == '-') {
                return LocalDateTime.parse(line.substring(0, 19).replace(" ", "T"));
            }

            // Cek format (at="2026-03-17T04:51:47")
            if (line.contains("at=\"")) {
                int start = line.indexOf("at=\"") + 4;
                if (line.length() >= start + 19) {
                    return LocalDateTime.parse(line.substring(start, start + 19));
                }
            }
        } catch (Exception e) {
            // Jika gagal parse, biarkan lanjut ke fallback
        }
        return LocalDateTime.now(); // Fallback jika tidak ditemukan format tanggal
    }

    /**
     * Ekstrak payload utama (XML/JSON) dari baris log.
     */
    private String extractPayload(String line, MonitorConfig config) {
        ResponseFormat format = config.getResponseFormat();

        if (format == ResponseFormat.XML) {
            return extractXmlPayload(line, config.getXmlWrapperTag());
        } else if (format == ResponseFormat.JSON) {
            return extractJsonPayload(line, config.getJsonPrefix());
        } else { // AUTO
            String json = extractJsonPayload(line, config.getJsonPrefix());
            if (json != null)
                return json;
            return extractXmlPayload(line, config.getXmlWrapperTag());
        }
    }

    private String extractJsonPayload(String line, String prefix) {
        String searchLine = line;
        if (prefix != null && !prefix.isBlank() && line.contains(prefix)) {
            searchLine = line.substring(line.indexOf(prefix) + prefix.length());
        }

        int start = searchLine.indexOf("{\"");
        if (start == -1)
            start = searchLine.indexOf("{ \""); // toleransi spasi

        if (start == -1)
            return null;

        String possibleJson = searchLine.substring(start);
        int end = possibleJson.lastIndexOf('}');

        if (end != -1) {
            return possibleJson.substring(0, end + 1);
        }
        return null;
    }

    private String extractXmlPayload(String line, String wrapperTag) {
        String searchTag = (wrapperTag != null && !wrapperTag.isBlank()) ? "<" + wrapperTag : "<";
        int start = line.indexOf(searchTag);
        if (start == -1 && wrapperTag == null) {
            start = line.indexOf("<?xml");
        }
        if (start != -1) {
            int end = line.lastIndexOf('>');
            if (end > start) {
                return line.substring(start, end + 1);
            }
        }
        return null;
    }

    /**
     * Baca payload ke struktur {@link JsonNode}.
     */
    private JsonNode readPayload(String payload, ResponseFormat responseFormat) throws Exception {
        if (responseFormat == ResponseFormat.XML) {
            return xmlMapper.readTree(payload.getBytes());
        }
        return objectMapper.readTree(payload);
    }

    /**
     * Ambil identifier numerik dari teks log.
     */
    private String extractIdentifier(String message) {
        Pattern pattern = Pattern.compile("(\\d{10,})");
        Matcher matcher = pattern.matcher(message);

        if (matcher.find()) {
            return matcher.group(1);
        }

        return null;
    }

    /**
     * Ambil nilai field berdasarkan konfigurasi, lalu fallback ke field default.
     */
    private String readConfiguredValue(JsonNode node, String configuredFieldName, String defaultFieldName) {
        String configuredValue = findTextIgnoreCase(node, configuredFieldName);
        if (!configuredValue.isBlank()) {
            return configuredValue;
        }
        return findTextIgnoreCase(node, defaultFieldName);
    }

    /**
     * Tentukan hasil sukses/gagal dari code/rc/status.
     */
    private boolean isSuccess(MonitorConfig config, String codeValue, String rcValue, String statusValue) {
        String code = codeValue != null ? codeValue.trim() : "";
        String rc = rcValue != null ? rcValue.trim() : "";
        String status = statusValue != null ? statusValue.trim() : "";

        String successCodesStr = config.getSuccessCodes() != null ? config.getSuccessCodes() : "0000,00";
        String[] successCodes = successCodesStr.split(",");
        java.util.Set<String> successSet = new java.util.HashSet<>();
        for (String s : successCodes) {
            successSet.add(s.trim());
        }

        boolean hasCode = !code.isEmpty();
        boolean hasRc = !rc.isEmpty();

        if (hasCode || hasRc) {
            // Cek apakah code atau rc mengandung nilai sukses (00 atau 0000)
            boolean codeOk = !hasCode || successSet.contains(code);
            boolean rcOk = !hasRc || successSet.contains(rc);
            return codeOk && rcOk;
        }

        // Fallback ke status field jika code/rc tidak ada
        return successSet.contains(status);
    }

    /**
     * Cek apakah field keputusan tersedia sebelum evaluasi status.
     */
    private boolean hasDecisionField(MonitorConfig config, String codeValue, String rcValue, String statusValue) {
        boolean codeConfigured = config.getCodeField() != null && !config.getCodeField().isBlank();
        boolean rcConfigured = config.getRcField() != null && !config.getRcField().isBlank();

        if (codeConfigured || rcConfigured) {
            boolean codePresent = !codeValue.isBlank();
            boolean rcPresent = !rcValue.isBlank();
            return codePresent || rcPresent;
        }

        return !statusValue.isBlank();
    }

    /**
     * Ambil nilai pertama yang tidak kosong.
     */
    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    /**
     * Cari nilai field secara rekursif tanpa sensitif huruf besar-kecil.
     */
    private String findTextIgnoreCase(JsonNode node, String fieldName) {
        if (fieldName == null || fieldName.isBlank()) {
            return "";
        }

        if (node == null || node.isMissingNode() || node.isNull()) {
            return "";
        }

        if (node.isObject()) {
            if (node.has(fieldName)) {
                return node.path(fieldName).asText("");
            }

            var fieldIterator = node.fields();
            while (fieldIterator.hasNext()) {
                var entry = fieldIterator.next();
                if (entry.getKey().equalsIgnoreCase(fieldName)) {
                    return entry.getValue().asText("");
                }

                String nestedValue = findTextIgnoreCase(entry.getValue(), fieldName);
                if (!nestedValue.isBlank()) {
                    return nestedValue;
                }
            }
        }

        if (node.isArray()) {
            for (JsonNode item : node) {
                String nestedValue = findTextIgnoreCase(item, fieldName);
                if (!nestedValue.isBlank()) {
                    return nestedValue;
                }
            }
        }

        return "";
    }
}
