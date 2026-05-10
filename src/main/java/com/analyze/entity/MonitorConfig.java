package com.analyze.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "monitor_configs")
@Data
public class MonitorConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "log_path", nullable = false, length = 1000)
    private String logPath;

    @Enumerated(EnumType.STRING)
    @Column(name = "response_format", nullable = false, length = 20)
    private ResponseFormat responseFormat;

    @Column(name = "code_field", length = 100)
    private String codeField;

    @Column(name = "rc_field", length = 100)
    private String rcField;

    @Column(name = "success_codes")
    private String successCodes = "0000,00";

    @Column(name = "json_prefix", length = 100)
    private String jsonPrefix;
    
    @Column(name = "xml_wrapper_tag", length = 100)
    private String xmlWrapperTag;

    @Column(nullable = false)
    private boolean enabled = true;

    // From ResponseConfig
    @Column(name = "response_name", nullable = false)
    private String responseName;

    @Column(name = "response_template", columnDefinition = "TEXT", nullable = false)
    private String responseTemplate;

    @Column(name = "response_description", columnDefinition = "TEXT")
    private String responseDescription;

    // SSH Config Relationship
    @ManyToOne
    @JoinColumn(name = "ssh_config_id")
    private SSHConfig sshConfig;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
