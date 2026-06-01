package com.stockdeck.dto;

public class StrategyResponse {
    private int buyDay;
    private int sellDay;
    private double profit;

    public StrategyResponse() {}

    public StrategyResponse(int buyDay, int sellDay, double profit) {
        this.buyDay = buyDay;
        this.sellDay = sellDay;
        this.profit = profit;
    }

    public int getBuyDay() { return buyDay; }
    public void setBuyDay(int buyDay) { this.buyDay = buyDay; }

    public int getSellDay() { return sellDay; }
    public void setSellDay(int sellDay) { this.sellDay = sellDay; }

    public double getProfit() { return profit; }
    public void setProfit(double profit) { this.profit = profit; }
}
