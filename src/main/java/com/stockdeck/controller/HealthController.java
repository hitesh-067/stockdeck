package com.stockdeck.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

/**
 * Simple health/ping endpoint to keep the Render free-tier instance warm.
 * An external cron service (e.g. cron-job.org) should hit /api/ping every 14 minutes.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class HealthController {

    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "ok");
        response.put("message", "StockDeck is alive!");
        return ResponseEntity.ok(response);
    }
}
