document.addEventListener('DOMContentLoaded', () => {
    let strategyChart;
    let currentMode = 'live'; // 'live' or 'manual'

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

                prices = data.prices;
                // Convert unix timestamps to readable dates for labels
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

            let tickerOrManual = currentMode === 'live' ? document.getElementById('ticker').value.trim().toUpperCase() : 'your manual input';
            updateUI(result, prices, labels, tickerOrManual);

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

    function updateUI(result, prices, labels, ticker) {
        
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

        renderChart(prices, labels, result.buyIndices, result.sellIndices);
    }

    function renderChart(prices, labels, buyIndices, sellIndices) {
        const ctx = document.getElementById('strategyChart').getContext('2d');
        if (strategyChart) strategyChart.destroy();

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#f8fafc' : '#111827';
        const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

        // Create point styles: green for buy, red for sell, invisible for normal
        const pointColors = prices.map((_, i) => {
            if (buyIndices.includes(i)) return '#10b981'; // Green
            if (sellIndices.includes(i)) return '#ef4444'; // Red
            return 'rgba(0,0,0,0)'; // Transparent
        });
        
        const pointRadii = prices.map((_, i) => {
            if (buyIndices.includes(i) || sellIndices.includes(i)) return 6;
            return 0;
        });

        strategyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Stock Price',
                    data: prices,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.2,
                    pointBackgroundColor: pointColors,
                    pointBorderColor: pointColors,
                    pointRadius: pointRadii,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: textColor }, grid: { color: gridColor } },
                    y: { ticks: { color: textColor }, grid: { color: gridColor } }
                },
                plugins: {
                    legend: { labels: { color: textColor } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = `Price: ₹${context.parsed.y.toFixed(2)}`;
                                if (buyIndices.includes(context.dataIndex)) label += ' (BUY)';
                                if (sellIndices.includes(context.dataIndex)) label += ' (SELL)';
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // Re-render chart on theme change to update colors
    window.addEventListener('themeChanged', () => {
        if (strategyChart) {
            // Need to trigger a re-analysis visually, or simply re-assign colors
            const analyzeBtn = document.getElementById('analyzeBtn');
            if(analyzeBtn && !analyzeBtn.disabled) {
               document.getElementById('strategyForm').dispatchEvent(new Event('submit'));
            }
        }
    });
});
