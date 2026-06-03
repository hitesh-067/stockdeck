document.addEventListener('DOMContentLoaded', () => {
    let strategyChart;
    let currentMode = 'live'; // 'live' or 'manual'
    let currentPrices = [], currentLabels = [], currentBuyIndices = [], currentSellIndices = [];

    // UI Elements
    const modeLiveBtn = document.getElementById('modeLiveBtn');
    const modeManualBtn = document.getElementById('modeManualBtn');
    const segmentHighlight = document.getElementById('segment-highlight');
    const inputLive = document.getElementById('inputLive');
    const inputManual = document.getElementById('inputManual');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const algorithmSelect = document.getElementById('algorithm');
    
    // Toggle Modes with Segmented Control
    modeLiveBtn.addEventListener('click', () => {
        currentMode = 'live';
        modeLiveBtn.classList.add('active');
        modeManualBtn.classList.remove('active');
        segmentHighlight.style.transform = 'translateX(0)';
        inputLive.style.display = 'block';
        inputManual.style.display = 'none';
    });

    modeManualBtn.addEventListener('click', () => {
        currentMode = 'manual';
        modeManualBtn.classList.add('active');
        modeLiveBtn.classList.remove('active');
        segmentHighlight.style.transform = 'translateX(100%)';
        inputManual.style.display = 'block';
        inputLive.style.display = 'none';
    });

    document.getElementById('strategyForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        analyzeBtn.textContent = 'Analyzing...';
        analyzeBtn.disabled = true;

        try {
            let prices = [];
            let labels = [];

            if (currentMode === 'live') {
                const ticker = document.getElementById('ticker').value.trim();
                if (!ticker) {
                    showToast('Please enter a stock ticker', 'error');
                    throw new Error('No ticker');
                }
                
                const res = await fetch(`/api/stock/history/${ticker}?range=1mo`);
                const data = await res.json();
                
                if (!res.ok) {
                    showToast(data.error || 'Failed to fetch live data', 'error');
                    throw new Error('API Error');
                }

                // If live data, we have open, high, low, prices (close), timestamps
                prices = data.prices;
                const ohlcData = [];
                for(let i = 0; i < data.timestamps.length; i++) {
                    ohlcData.push({
                        time: data.timestamps[i], // unix timestamp in seconds
                        open: data.open[i],
                        high: data.high[i],
                        low: data.low[i],
                        close: data.prices[i]
                    });
                }
                
                // Keep labels for UI
                labels = data.timestamps.map(ts => {
                    const d = new Date(ts * 1000);
                    return `${d.getMonth()+1}/${d.getDate()}`;
                });
                
                showToast(`Loaded 30-day history for ${data.symbol}`, 'success');

            } else {
                const pricesInput = document.getElementById('prices').value;
                prices = pricesInput.split(',').map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
                if (prices.length < 2) {
                    showToast('Please enter at least 2 valid prices.', 'error');
                    throw new Error('Invalid input');
                }
                labels = prices.map((_, i) => `Day ${i + 1}`);
            }

            // Run chosen algorithm
            const algo = algorithmSelect.value;
            let result;
            
            if (algo === 'single') {
                result = runSingleTradeAlgorithm(prices);
            } else {
                result = runMultipleTradesAlgorithm(prices);
            }

            // Hide placeholder, show results
            document.getElementById('placeholderSection').style.display = 'none';
            document.getElementById('resultSection').style.display = 'block';
            document.getElementById('chartSection').style.display = 'block';

            let tickerOrManual = currentMode === 'live' ? document.getElementById('ticker').value.trim().toUpperCase() : 'your manual input';
            
            // Re-fetch data if live for OHLC to pass to updateUI, or pass it directly
            let chartData = null;
            if (currentMode === 'live') {
                 chartData = [];
                 const data = await (await fetch(`/api/stock/history/${tickerOrManual}?range=1mo`)).json();
                 for(let i = 0; i < data.timestamps.length; i++) {
                    chartData.push({
                        time: data.timestamps[i],
                        open: data.open[i],
                        high: data.high[i],
                        low: data.low[i],
                        close: data.prices[i]
                    });
                 }
            } else {
                 chartData = prices.map((p, i) => ({ time: i, value: p }));
            }
            
            updateUI(result, prices, labels, tickerOrManual, chartData);

        } catch (err) {
            console.error(err);
        } finally {
            analyzeBtn.textContent = 'Run Analysis';
            analyzeBtn.disabled = false;
        }
    });

    function runSingleTradeAlgorithm(prices) {
        if (!prices || prices.length < 2) return null;
        
        let minPrice = prices[0];
        let minIdx = 0;
        
        let maxProfit = 0;
        let bestBuyIdx = 0;
        let bestSellIdx = 0;

        for (let i = 1; i < prices.length; i++) {
            let currentProfit = prices[i] - minPrice;
            if (currentProfit > maxProfit) {
                maxProfit = currentProfit;
                bestBuyIdx = minIdx;
                bestSellIdx = i;
            }
            if (prices[i] < minPrice) {
                minPrice = prices[i];
                minIdx = i;
            }
        }
        
        return {
            maxProfit,
            buyIndices: maxProfit > 0 ? [bestBuyIdx] : [],
            sellIndices: maxProfit > 0 ? [bestSellIdx] : [],
            type: 'single'
        };
    }

    function runMultipleTradesAlgorithm(prices) {
        if (!prices || prices.length < 2) return null;

        let maxProfit = 0;
        let buyIndices = [];
        let sellIndices = [];

        for (let i = 1; i < prices.length; i++) {
            if (prices[i] > prices[i - 1]) {
                maxProfit += (prices[i] - prices[i - 1]);
                buyIndices.push(i - 1);
                sellIndices.push(i);
            }
        }

        return {
            maxProfit,
            buyIndices,
            sellIndices,
            type: 'multiple'
        };
    }

    function updateUI(result, prices, labels, ticker, chartData) {
        
        if (result.maxProfit > 0) {
            let investment = result.type === 'single' ? prices[result.buyIndices[0]] : prices[0];
            let roi = (result.maxProfit / investment) * 100;
            
            if (result.type === 'single') {
                document.getElementById('resBuy').textContent = labels[result.buyIndices[0]];
                document.getElementById('resSell').textContent = labels[result.sellIndices[0]];
                document.getElementById('nl-summary').textContent = `The algorithm executed a single trade on ${ticker}, yielding a net profit of ₹${result.maxProfit.toFixed(2)} (${roi.toFixed(1)}% ROI).`;
            } else {
                document.getElementById('resBuy').textContent = `${result.buyIndices.length} Trades`;
                document.getElementById('resSell').textContent = `Multiple`;
                document.getElementById('nl-summary').textContent = `The algorithm executed ${result.buyIndices.length} sequential trades on ${ticker}, yielding a net profit of ₹${result.maxProfit.toFixed(2)} (${roi.toFixed(1)}% ROI).`;
            }
            
            document.getElementById('resProfit').textContent = `₹${result.maxProfit.toFixed(2)}`;
            document.getElementById('resROI').textContent = `+${roi.toFixed(1)}%`;
            
        } else {
            document.getElementById('resBuy').textContent = 'None';
            document.getElementById('resSell').textContent = 'None';
            document.getElementById('resProfit').textContent = '₹0';
            document.getElementById('resROI').textContent = '0%';
            document.getElementById('nl-summary').textContent = `The algorithm could not find any profitable trading opportunities for ${ticker} in this time period.`;
            document.getElementById('nl-summary').style.color = 'var(--danger-color)';
        }

        currentPrices = prices;
        currentLabels = labels;
        currentBuyIndices = result.buyIndices;
        currentSellIndices = result.sellIndices;
        renderChart(prices, labels, result.buyIndices, result.sellIndices);
    }

    function renderChart(prices, labels, buyIndices, sellIndices) {
        const canvas = document.getElementById('strategyChart');
        const ctx = canvas.getContext('2d');
        if (strategyChart) {
            strategyChart.destroy();
        }
        
        const pointColors = prices.map((_, i) => {
            if (buyIndices.includes(i)) return '#10b981'; // Green for BUY
            if (sellIndices.includes(i)) return '#ef4444'; // Red for SELL
            return 'transparent'; // No point
        });

        const pointRadii = prices.map((_, i) => {
            if (buyIndices.includes(i) || sellIndices.includes(i)) return 6;
            return 0;
        });

        const pointBorderWidths = prices.map((_, i) => {
            if (buyIndices.includes(i) || sellIndices.includes(i)) return 2;
            return 0;
        });
        
        // Ensure gradient has height. We use canvas height or a default.
        const chartHeight = canvas.parentElement.clientHeight || 400;
        let gradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const tickColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)';
        const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)';
        const tooltipBg = isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)';
        const tooltipTitle = isDark ? '#fff' : '#0f172a';
        const tooltipBody = isDark ? '#cbd5e1' : '#475569';
        const tooltipBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

        strategyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Stock Price (₹)',
                    data: prices,
                    borderColor: '#3b82f6',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.2, // Smooth curve
                    pointBackgroundColor: pointColors,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: pointBorderWidths,
                    pointRadius: pointRadii,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: tickColor }
                    },
                    y: {
                        grid: { color: gridColor, drawBorder: false },
                        ticks: { color: tickColor }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        titleColor: tooltipTitle,
                        bodyColor: tooltipBody,
                        borderColor: tooltipBorder,
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                let label = 'Price: ₹' + context.parsed.y.toFixed(2);
                                if (buyIndices.includes(context.dataIndex)) label += ' (BUY SIGNAL)';
                                if (sellIndices.includes(context.dataIndex)) label += ' (SELL SIGNAL)';
                                return label;
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                }
            }
        });
    }

    // Re-render chart on theme change to update colors
    window.addEventListener('themeChanged', () => {
        if (strategyChart && currentPrices.length > 0) {
            renderChart(currentPrices, currentLabels, currentBuyIndices, currentSellIndices);
        }
    });
});
