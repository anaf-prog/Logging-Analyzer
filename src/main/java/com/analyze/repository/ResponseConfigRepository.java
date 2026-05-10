package com.analyze.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.analyze.entity.ResponseConfig;

@Repository
public interface ResponseConfigRepository extends JpaRepository<ResponseConfig, Long>, JpaSpecificationExecutor<ResponseConfig> {

    List<ResponseConfig> findAllByOrderByNameAsc();
    
}
