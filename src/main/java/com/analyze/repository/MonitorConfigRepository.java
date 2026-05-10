package com.analyze.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.analyze.entity.MonitorConfig;

@Repository
public interface MonitorConfigRepository extends JpaRepository<MonitorConfig, Long> {
    
    List<MonitorConfig> findByEnabledTrue();
    
    List<MonitorConfig> findBySshConfigId(Long sshConfigId);
    
    Optional<MonitorConfig> findByProductNameAndEnabledTrue(String productName);
    
    @Query("SELECT mc FROM MonitorConfig mc WHERE mc.sshConfig IS NOT NULL AND mc.enabled = true")
    List<MonitorConfig> findWithSshConfigAndEnabled();
    
    @Query("SELECT DISTINCT mc.productName FROM MonitorConfig mc WHERE mc.enabled = true")
    List<String> findDistinctProductNames();
    
    @Query("SELECT mc FROM MonitorConfig mc WHERE " +
           "(:productName IS NULL OR LOWER(mc.productName) LIKE LOWER(CONCAT('%', :productName, '%'))) AND " +
           "(:sshConfigId IS NULL OR mc.sshConfig.id = :sshConfigId) AND " +
           "mc.enabled = true")
    List<MonitorConfig> findByFilters(@Param("productName") String productName, 
                                     @Param("sshConfigId") Long sshConfigId);
}
