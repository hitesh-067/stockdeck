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

    async function fetchStats() {
        try {
            const res = await fetch(`/api/calculations/dashboard/stats/${userId}`);
            const stats = await res.json();

            document.getElementById('stat-calcs').textContent = stats.totalCalculations;
            document.getElementById('stat-profit').textContent = `₹${stats.totalProfit.toFixed(2)}`;
            document.getElementById('stat-loss').textContent = `₹${stats.totalLoss.toFixed(2)}`;
            document.getElementById('stat-top-stock').textContent = stats.topStockName;
            
            if (stats.topStockName !== 'N/A') {
                document.getElementById('stat-top-profit').textContent = `+₹${stats.topStockProfit.toFixed(2)}`;
            } else {
                document.getElementById('stat-top-profit').textContent = '';
            }

            renderDoughnutChart(stats.totalProfit, stats.totalLoss);
            
            // Fetch history for trend chart
            const histRes = await fetch(`/api/calculations/history/${userId}`);
            const history = await histRes.json();
            renderLineChart(history);

        } catch (err) {
            console.error('Failed to load dashboard stats', err);
        }
    }

    function renderDoughnutChart(profit, loss) {
        const ctx = document.getElementById('doughnutChart').getContext('2d');
        if (doughnutChart) doughnutChart.destroy();

        // if both are 0, chart looks empty, provide some default visual
        const data = (profit === 0 && loss === 0) ? [1] : [profit, loss];
        const bgColors = (profit === 0 && loss === 0) ? ['#cbd5e1'] : ['#10b981', '#ef4444'];
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
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor }
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

        lineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Profit/Loss (₹)',
                    data: data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    fill: true,
                    tension: 0.4
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
                    }
                }
            }
        });
    }

    // Re-render charts on theme change to update text colors
    window.addEventListener('themeChanged', () => {
        fetchStats();
    });

    fetchStats();
});
