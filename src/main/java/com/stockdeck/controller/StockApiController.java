package com.stockdeck.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/stock")
@CrossOrigin(origins = "*")
public class StockApiController {

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/quote/{ticker}")
    public ResponseEntity<?> getStockQuote(@PathVariable String ticker) {
        try {
            // Using Yahoo Finance public API
            String url = "https://query2.finance.yahoo.com/v8/finance/chart/" + ticker.toUpperCase();
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            if (response != null && response.containsKey("chart")) {
                Map<String, Object> chart = (Map<String, Object>) response.get("chart");
                java.util.List<Map<String, Object>> result = (java.util.List<Map<String, Object>>) chart.get("result");
                
                if (result != null && !result.isEmpty()) {
                    Map<String, Object> meta = (Map<String, Object>) result.get(0).get("meta");
                    Object price = meta.get("regularMarketPrice");
                    return ResponseEntity.ok(Map.of("price", price, "symbol", ticker.toUpperCase()));
                }
            }
            return ResponseEntity.badRequest().body(Map.of("error", "Stock not found"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch stock data"));
        }
    }
}
