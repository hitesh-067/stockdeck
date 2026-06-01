package com.stockdeck.repository;

import com.stockdeck.model.Calculation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CalculationRepository extends JpaRepository<Calculation, Long> {
    List<Calculation> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
