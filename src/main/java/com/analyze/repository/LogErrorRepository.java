package com.analyze.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.analyze.entity.LogError;

@Repository
public interface LogErrorRepository extends JpaRepository<LogError, Long>, JpaSpecificationExecutor<LogError> {

    List<LogError> findTop10ByOrderByLogTimeDesc();

    boolean existsByProductNameAndMessage(String productName, String message);
}

