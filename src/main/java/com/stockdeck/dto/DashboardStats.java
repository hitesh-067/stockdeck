package com.stockdeck.dto;

public class DashboardStats {
    private int totalCalculations;
    private double totalProfit;
    private double totalLoss;
    private double netProfit;
    private String topStockName;
    private double topStockProfit;
    private double winRate;

    public DashboardStats() {}

    public int getTotalCalculations() { return totalCalculations; }
    public void setTotalCalculations(int totalCalculations) { this.totalCalculations = totalCalculations; }

    public double getTotalProfit() { return totalProfit; }
    public void setTotalProfit(double totalProfit) { this.totalProfit = totalProfit; }

    public double getTotalLoss() { return totalLoss; }
    public void setTotalLoss(double totalLoss) { this.totalLoss = totalLoss; }

    public double getNetProfit() { return netProfit; }
    public void setNetProfit(double netProfit) { this.netProfit = netProfit; }

    public String getTopStockName() { return topStockName; }
    public void setTopStockName(String topStockName) { this.topStockName = topStockName; }

    public double getTopStockProfit() { return topStockProfit; }
    public void setTopStockProfit(double topStockProfit) { this.topStockProfit = topStockProfit; }

    public double getWinRate() { return winRate; }
    public void setWinRate(double winRate) { this.winRate = winRate; }
}
