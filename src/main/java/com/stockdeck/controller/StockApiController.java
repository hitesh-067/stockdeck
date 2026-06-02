package com.stockdeck.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
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
            String url = "https://query2.finance.yahoo.com/v8/finance/chart/" + ticker.toUpperCase();
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> response = responseEntity.getBody();
            
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

    @GetMapping("/history/{ticker}")
    public ResponseEntity<?> getStockHistory(
            @PathVariable String ticker, 
            @RequestParam(defaultValue = "1mo") String range) {
        try {
            String url = "https://query2.finance.yahoo.com/v8/finance/chart/" + ticker.toUpperCase() + "?range=" + range + "&interval=1d";
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> response = responseEntity.getBody();
            
            if (response != null && response.containsKey("chart")) {
                Map<String, Object> chart = (Map<String, Object>) response.get("chart");
                java.util.List<Map<String, Object>> result = (java.util.List<Map<String, Object>>) chart.get("result");
                
                if (result != null && !result.isEmpty()) {
                    Map<String, Object> resultData = result.get(0);
                    java.util.List<Integer> timestamp = (java.util.List<Integer>) resultData.get("timestamp");
                    
                    Map<String, Object> indicators = (Map<String, Object>) resultData.get("indicators");
                    java.util.List<Map<String, Object>> quote = (java.util.List<Map<String, Object>>) indicators.get("quote");
                    java.util.List<Double> close = (java.util.List<Double>) quote.get(0).get("close");
                    
                    return ResponseEntity.ok(Map.of(
                        "symbol", ticker.toUpperCase(),
                        "timestamps", timestamp,
                        "prices", close
                    ));
                }
            }
            return ResponseEntity.badRequest().body(Map.of("error", "Stock not found"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch stock history"));
        }
    }
}
