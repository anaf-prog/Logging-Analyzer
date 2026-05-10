package com.analyze.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.analyze.entity.SSHConfig;

@Repository
public interface SSHConfigRepository extends JpaRepository<SSHConfig, Long> {
    List<SSHConfig> findAllByOrderByNameAscIdAsc();

    Optional<SSHConfig> findFirstByEnabledTrueOrderByIdAsc();
}
