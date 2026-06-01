package com.stockdeck.controller;

import com.stockdeck.dto.StrategyRequest;
import com.stockdeck.dto.StrategyResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class StrategyController {

    @PostMapping("/max-profit")
    public ResponseEntity<?> calculateMaxProfit(@RequestBody StrategyRequest request) {
        try {
            List<Double> prices = request.getPrices();
            if (prices == null || prices.size() < 2) {
                return ResponseEntity.badRequest().body(Map.of("error", "At least two prices are required"));
            }

            double minPrice = Double.POSITIVE_INFINITY;
            double maxProfit = 0;
            int buyDay = 0;
            int sellDay = 0;
            
            int currentMinDay = 1;

            for (int i = 0; i < prices.size(); i++) {
                double price = prices.get(i);
                int currentDay = i + 1; // 1-indexed for display

                if (price < minPrice) {
                    minPrice = price;
                    currentMinDay = currentDay;
                }

                double profit = price - minPrice;
                if (profit > maxProfit) {
                    maxProfit = profit;
                    buyDay = currentMinDay;
                    sellDay = currentDay;
                }
            }
            
            // If maxProfit is 0, no transaction was made (sellDay=0, buyDay=0 conceptually, but we'll return them as 0 to indicate no trade)
            if (maxProfit == 0) {
                buyDay = 0;
                sellDay = 0;
            }

            StrategyResponse response = new StrategyResponse(buyDay, sellDay, maxProfit);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
