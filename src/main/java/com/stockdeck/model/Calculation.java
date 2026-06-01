package com.stockdeck.model;

import jakarta.persistence.*;

@Entity
@Table(name = "calculations")
public class Calculation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String stockName;

    @Column(nullable = false)
    private double buyPrice;

    @Column(nullable = false)
    private double sellPrice;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private double profit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public Calculation() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStockName() { return stockName; }
    public void setStockName(String stockName) { this.stockName = stockName; }

    public double getBuyPrice() { return buyPrice; }
    public void setBuyPrice(double buyPrice) { this.buyPrice = buyPrice; }

    public double getSellPrice() { return sellPrice; }
    public void setSellPrice(double sellPrice) { this.sellPrice = sellPrice; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public double getProfit() { return profit; }
    public void setProfit(double profit) { this.profit = profit; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
