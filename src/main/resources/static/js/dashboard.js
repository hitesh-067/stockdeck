document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');

    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('nav-username').textContent = username;
    document.getElementById('welcome-name').textContent = username;

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    let doughnutChart, lineChart;
    let fullHistoryData = []; // Store full history for filtering

    async function fetchStats() {
        try {
            // Apply skeletons
            ['stat-calcs', 'stat-profit', 'stat-loss', 'stat-top-stock', 'stat-winrate'].forEach(id => {
                const el = document.getElementById(id);
                if(el) el.classList.add('skeleton');
            });

            const res = await fetch(`/api/calculations/dashboard/stats/${userId}`);
            const stats = await res.json();

            // Remove skeletons
            ['stat-calcs', 'stat-profit', 'stat-loss', 'stat-top-stock', 'stat-winrate'].forEach(id => {
                const el = document.getElementById(id);
                if(el) el.classList.remove('skeleton');
            });
            
            const winRate = stats.winRate || 0;
            document.getElementById('stat-winrate').textContent = `${winRate.toFixed(1)}%`;
            document.getElementById('stat-calcs').textContent = `(${stats.totalCalculations} trades)`;
            document.getElementById('winrate-bar').style.width = `${winRate}%`;

            document.getElementById('stat-profit').textContent = `₹${stats.totalProfit.toFixed(2)}`;
            document.getElementById('stat-loss').textContent = `₹${stats.totalLoss.toFixed(2)}`;
            document.getElementById('stat-top-stock').textContent = stats.topStockName;
            
            if (stats.topStockName !== 'N/A') {
                document.getElementById('stat-top-profit').textContent = `+₹${stats.topStockProfit.toFixed(2)}`;
            } else {
                document.getElementById('stat-top-profit').textContent = '';
            }

            renderDoughnutChart(stats.totalProfit, stats.totalLoss);
            
            // Fetch history for trend chart and activity feed
            const histRes = await fetch(`/api/calculations/history/${userId}`);
            fullHistoryData = await histRes.json();
            renderLineChart(fullHistoryData);
            renderActivityFeed(fullHistoryData);

        } catch (err) {
            console.error('Failed to load dashboard stats', err);
            if(window.showToast) showToast('Failed to load dashboard stats', 'error');
        }
    }

    function renderDoughnutChart(profit, loss) {
        const ctx = document.getElementById('doughnutChart').getContext('2d');
        if (doughnutChart) doughnutChart.destroy();

        // if both are 0, chart looks empty, provide some default visual
        const data = (profit === 0 && loss === 0) ? [1] : [profit, loss];
        const bgColors = (profit === 0 && loss === 0) ? ['#cbd5e1'] : ['#34d399', '#fb7185'];
        const labels = (profit === 0 && loss === 0) ? ['No Data'] : ['Profit', 'Loss'];

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#f8fafc' : '#111827';

        doughnutChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: bgColors,
                    borderWidth: 0,
                    borderRadius: 8,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor, padding: 20, usePointStyle: true }
                    }
                }
            }
        });
    }

    function renderLineChart(history) {
        const ctx = document.getElementById('lineChart').getContext('2d');
        if (lineChart) lineChart.destroy();

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#f8fafc' : '#111827';
        const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

        // Prepare data: chronological sort might be needed if they were timestamps, but here we just take order of insertion
        const labels = history.map((_, i) => `Trade ${i+1}`);
        const data = history.map(h => h.profit);
        
        let gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

        lineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Profit/Loss (₹)',
                    data: data,
                    borderColor: '#3b82f6',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: 'transparent',
                    pointRadius: 0,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: { color: textColor },
                        grid: { display: false }
                    },
                    y: {
                        ticks: { color: textColor },
                        grid: { color: gridColor, drawBorder: false }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: gridColor,
                        borderWidth: 1
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    function renderActivityFeed(history) {
        const feed = document.getElementById('activity-feed');
        feed.innerHTML = '';

        if (!history || history.length === 0) {
            feed.innerHTML = '<p style="text-align: center; opacity: 0.6; margin-top: 2rem;">No recent activity.</p>';
            return;
        }

        // Show only the 5 most recent trades (assuming history is chronological, we reverse it to show newest first)
        const recentTrades = [...history].reverse().slice(0, 5);

        recentTrades.forEach(trade => {
            const isProfit = trade.profit >= 0;
            const sign = isProfit ? '+' : '';
            const type = isProfit ? 'profit' : 'loss';
            const icon = isProfit ? '✓' : '✗';
            const color = isProfit ? 'var(--accent-color)' : 'var(--danger-color)';

            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-dot ${type}">${icon}</div>
                <div class="activity-content">
                    <div class="activity-title" style="display: flex; justify-content: space-between;">
                        <span>Traded ${trade.stockName}</span>
                        <span style="color: ${color};">${sign}₹${Math.abs(trade.profit).toFixed(2)}</span>
                    </div>
                    <div class="activity-meta">
                        Bought at ₹${trade.buyPrice} • Sold at ₹${trade.sellPrice} • Qty: ${trade.quantity}
                    </div>
                </div>
            `;
            feed.appendChild(item);
        });
    }

    // Re-render charts on theme change to update text colors
    window.addEventListener('themeChanged', () => {
        fetchStats();
    });

    // Setup chart filters
    const filterBtns = document.querySelectorAll('.chart-filters button');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            filterBtns.forEach(b => {
                b.classList.remove('btn-primary');
                b.classList.add('btn-outline');
            });
            e.target.classList.remove('btn-outline');
            e.target.classList.add('btn-primary');

            // Filter data (mock time filtering by slicing latest trades)
            const type = e.target.textContent;
            let filteredData = [...fullHistoryData];
            
            if (type === '1W') {
                // Mock 1 week = last 5 trades
                filteredData = filteredData.slice(0, 5);
            } else if (type === '1M') {
                // Mock 1 month = last 20 trades
                filteredData = filteredData.slice(0, 20);
            }
            
            renderLineChart(filteredData);
        });
    });

    fetchStats();
});
