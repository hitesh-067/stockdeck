package com.stockdeck.controller;

import com.stockdeck.dto.CalculationRequest;
import com.stockdeck.dto.DashboardStats;
import com.stockdeck.model.Calculation;
import com.stockdeck.service.CalculationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/calculations")
@CrossOrigin(origins = "*")
public class CalculationController {

    @Autowired
    private CalculationService calculationService;

    @PostMapping
    public ResponseEntity<?> saveCalculation(@RequestBody CalculationRequest request) {
        try {
            Calculation calc = calculationService.saveCalculation(request);
            // return without user details to avoid cyclic reference issues on serialization
            Map<String, Object> response = new HashMap<>();
            response.put("id", calc.getId());
            response.put("stockName", calc.getStockName());
            response.put("buyPrice", calc.getBuyPrice());
            response.put("sellPrice", calc.getSellPrice());
            response.put("quantity", calc.getQuantity());
            response.put("profit", calc.getProfit());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/history/{userId}")
    public ResponseEntity<List<Calculation>> getHistory(@PathVariable Long userId) {
        List<Calculation> history = calculationService.getUserHistory(userId);
        // Map to avoid exposing User entity
        List<Map<String, Object>> res = history.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("stockName", c.getStockName());
            map.put("buyPrice", c.getBuyPrice());
            map.put("sellPrice", c.getSellPrice());
            map.put("quantity", c.getQuantity());
            map.put("profit", c.getProfit());
            return map;
        }).toList();
        return ResponseEntity.ok((List) res);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCalculation(@PathVariable Long id) {
        calculationService.deleteCalculation(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Deleted successfully");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/clear/{userId}")
    public ResponseEntity<?> clearHistory(@PathVariable Long userId) {
        calculationService.clearHistory(userId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "History cleared");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/dashboard/stats/{userId}")
    public ResponseEntity<DashboardStats> getDashboardStats(@PathVariable Long userId) {
        return ResponseEntity.ok(calculationService.getDashboardStats(userId));
    }
}
