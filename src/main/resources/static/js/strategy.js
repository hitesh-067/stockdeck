let strategyChart;

document.getElementById('strategyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pricesInput = document.getElementById('prices').value;
    const alertBox = document.getElementById('alertBox');
    
    // parse input
    const pricesStr = pricesInput.split(',').map(s => s.trim());
    const prices = pricesStr.map(s => parseFloat(s)).filter(n => !isNaN(n));
    
    if (prices.length < 2) {
        alertBox.className = 'alert error';
        alertBox.textContent = 'Please provide at least two valid numerical prices.';
        return;
    }
    
    alertBox.style.display = 'none';

    try {
        const res = await fetch('/api/max-profit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prices })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            document.getElementById('resultSection').style.display = 'block';
            
            if (data.profit > 0) {
                document.getElementById('resBuy').textContent = `Day ${data.buyDay}`;
                document.getElementById('resSell').textContent = `Day ${data.sellDay}`;
                document.getElementById('resProfit').textContent = `₹${data.profit.toFixed(2)}`;
            } else {
                document.getElementById('resBuy').textContent = `No Buy`;
                document.getElementById('resSell').textContent = `No Sell`;
                document.getElementById('resProfit').textContent = `₹0.00`;
            }
            
            renderStrategyChart(prices, data.buyDay, data.sellDay);
        } else {
            alertBox.className = 'alert error';
            alertBox.textContent = data.error || 'Analysis failed.';
            alertBox.style.display = 'block';
        }
    } catch (err) {
        alertBox.className = 'alert error';
        alertBox.textContent = 'Server error. Please try again.';
        alertBox.style.display = 'block';
    }
});

function renderStrategyChart(prices, buyDay, sellDay) {
    const ctx = document.getElementById('strategyChart').getContext('2d');
    if (strategyChart) strategyChart.destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#f8fafc' : '#111827';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    const labels = prices.map((_, i) => `Day ${i + 1}`);
    
    // Highlight points
    const pointBackgroundColors = prices.map((_, i) => {
        const day = i + 1;
        if (day === buyDay) return '#10b981'; // accent color (greenish)
        if (day === sellDay) return '#ef4444'; // danger color (reddish)
        return '#3b82f6'; // default primary
    });
    
    const pointRadii = prices.map((_, i) => {
        const day = i + 1;
        if (day === buyDay || day === sellDay) return 8;
        return 4;
    });

    strategyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Stock Price (₹)',
                data: prices,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.2,
                pointBackgroundColor: pointBackgroundColors,
                pointRadius: pointRadii,
                pointHoverRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                y: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                legend: {
                    labels: { color: textColor }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += '₹' + context.parsed.y;
                            }
                            const day = context.dataIndex + 1;
                            if (day === buyDay) label += ' (BUY)';
                            if (day === sellDay) label += ' (SELL)';
                            return label;
                        }
                    }
                }
            }
        }
    });
}
