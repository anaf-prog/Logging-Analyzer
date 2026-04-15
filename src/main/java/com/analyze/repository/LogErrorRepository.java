package com.analyze.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.analyze.entity.LogError;

import jakarta.transaction.Transactional;

@Repository
public interface LogErrorRepository extends JpaRepository<LogError, Long>, JpaSpecificationExecutor<LogError> {

    List<LogError> findTop10ByOrderByLogTimeDesc();

    Page<LogError> findAllByOrderByLogTimeDesc(Pageable pageable);

    boolean existsByProductNameAndMessage(String productName, String message);

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO error_logs (product_name, level, log_time, message, identifier, message_hash, created_at) " +
                   "VALUES (:productName, :level, :logTime, :message, :identifier, :messageHash, :createdAt) " +
                   "ON CONFLICT (message_hash) DO NOTHING", nativeQuery = true)
    void insertIgnore(
        @Param("productName") String productName,
        @Param("level") String level,
        @Param("logTime") LocalDateTime logTime,
        @Param("message") String message,
        @Param("identifier") String identifier,
        @Param("messageHash") String messageHash,
        @Param("createdAt") LocalDateTime createdAt
    );
}

