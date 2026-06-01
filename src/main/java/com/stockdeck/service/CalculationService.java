package com.stockdeck.service;

import com.stockdeck.dto.CalculationRequest;
import com.stockdeck.dto.DashboardStats;
import com.stockdeck.model.Calculation;
import com.stockdeck.model.User;
import com.stockdeck.repository.CalculationRepository;
import com.stockdeck.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CalculationService {

    @Autowired
    private CalculationRepository calculationRepository;

    @Autowired
    private UserRepository userRepository;

    public Calculation saveCalculation(CalculationRequest request) throws Exception {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new Exception("User not found"));

        double profit = (request.getSellPrice() - request.getBuyPrice()) * request.getQuantity();

        Calculation calc = new Calculation();
        calc.setStockName(request.getStockName());
        calc.setBuyPrice(request.getBuyPrice());
        calc.setSellPrice(request.getSellPrice());
        calc.setQuantity(request.getQuantity());
        calc.setProfit(profit);
        calc.setUser(user);

        return calculationRepository.save(calc);
    }

    public List<Calculation> getUserHistory(Long userId) {
        return calculationRepository.findByUserId(userId);
    }

    public void deleteCalculation(Long id) {
        calculationRepository.deleteById(id);
    }

    @Transactional
    public void clearHistory(Long userId) {
        calculationRepository.deleteByUserId(userId);
    }

    public DashboardStats getDashboardStats(Long userId) {
        List<Calculation> history = calculationRepository.findByUserId(userId);
        
        DashboardStats stats = new DashboardStats();
        stats.setTotalCalculations(history.size());

        double totalProfit = 0;
        double totalLoss = 0;
        double maxProfit = Double.NEGATIVE_INFINITY;
        String topStock = "None";

        for (Calculation c : history) {
            if (c.getProfit() >= 0) {
                totalProfit += c.getProfit();
            } else {
                totalLoss += Math.abs(c.getProfit());
            }

            if (c.getProfit() > maxProfit) {
                maxProfit = c.getProfit();
                topStock = c.getStockName();
            }
        }

        stats.setTotalProfit(totalProfit);
        stats.setTotalLoss(totalLoss);
        stats.setNetProfit(totalProfit - totalLoss);
        
        if (maxProfit != Double.NEGATIVE_INFINITY && maxProfit >= 0) {
            stats.setTopStockName(topStock);
            stats.setTopStockProfit(maxProfit);
        } else {
            stats.setTopStockName("N/A");
            stats.setTopStockProfit(0);
        }

        return stats;
    }
}
