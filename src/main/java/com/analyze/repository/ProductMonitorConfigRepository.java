package com.analyze.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.analyze.entity.ProductMonitorConfig;

@Repository
public interface ProductMonitorConfigRepository extends JpaRepository<ProductMonitorConfig, Long> {
    List<ProductMonitorConfig> findAllByOrderByProductNameAscIdAsc();

    List<ProductMonitorConfig> findByEnabledTrueOrderByProductNameAscIdAsc();
}
