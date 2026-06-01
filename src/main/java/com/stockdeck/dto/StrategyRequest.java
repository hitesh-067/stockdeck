package com.stockdeck.dto;

import java.util.List;

public class StrategyRequest {
    private List<Double> prices;

    public StrategyRequest() {}

    public List<Double> getPrices() { return prices; }
    public void setPrices(List<Double> prices) { this.prices = prices; }
}
