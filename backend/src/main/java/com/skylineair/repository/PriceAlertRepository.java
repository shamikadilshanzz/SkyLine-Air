package com.skylineair.repository;

import com.skylineair.model.PriceAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PriceAlertRepository extends JpaRepository<PriceAlert, Long> {
    List<PriceAlert> findByUserEmail(String userEmail);
    List<PriceAlert> findByUserId(Long userId);
}
