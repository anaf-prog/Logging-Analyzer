package com.analyze.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(
    name = "error_logs",
    indexes = {
        @Index(name = "idx_product_name", columnList = "product_name"),
        @Index(name = "idx_identifier", columnList = "identifier"),
        @Index(name = "idx_log_time", columnList = "log_time"),
        @Index(name = "idx_msg_hash", columnList = "message_hash", unique = true)
    })
@Data
public class LogError {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_name")
    private String productName;

    private String level;

    @Column(name = "log_time")
    private LocalDateTime logTime;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    private String identifier;

    @Column(name = "message_hash")
    private String messageHash;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
    
}
