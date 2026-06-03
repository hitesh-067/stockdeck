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

        renderChart(chartData, result.buyIndices, result.sellIndices);
    }

    function renderChart(chartData, buyIndices, sellIndices) {
        const chartContainer = document.getElementById('strategyChart');
        chartContainer.innerHTML = ''; // Clear previous chart
        
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#f8fafc' : '#111827';
        const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        const bg = isDark ? 'transparent' : 'transparent';

        const chart = LightweightCharts.createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: chartContainer.clientHeight,
            layout: {
                background: { type: 'solid', color: bg },
                textColor: textColor,
            },
            grid: {
                vertLines: { color: gridColor },
                horzLines: { color: gridColor },
            },
            rightPriceScale: {
                borderVisible: false,
            },
            timeScale: {
                borderVisible: false,
            },
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            chart.applyOptions({ width: chartContainer.clientWidth, height: chartContainer.clientHeight });
        });

        let series;
        if (currentMode === 'live') {
            series = chart.addCandlestickSeries({
                upColor: '#10b981',
                downColor: '#ef4444',
                borderVisible: false,
                wickUpColor: '#10b981',
                wickDownColor: '#ef4444',
            });
            series.setData(chartData);
        } else {
            series = chart.addLineSeries({
                color: '#3b82f6',
                lineWidth: 2,
            });
            series.setData(chartData);
        }

        // Add Markers
        const markers = [];
        
        buyIndices.forEach(idx => {
            if(chartData[idx]) {
                markers.push({
                    time: chartData[idx].time,
                    position: 'belowBar',
                    color: '#10b981',
                    shape: 'arrowUp',
                    text: 'BUY',
                });
            }
        });
        
        sellIndices.forEach(idx => {
            if(chartData[idx]) {
                markers.push({
                    time: chartData[idx].time,
                    position: 'aboveBar',
                    color: '#ef4444',
                    shape: 'arrowDown',
                    text: 'SELL',
                });
            }
        });
        
        // Sort markers by time (Lightweight charts requirement)
        markers.sort((a, b) => {
            return (a.time > b.time) ? 1 : ((b.time > a.time) ? -1 : 0);
        });

        series.setMarkers(markers);
        chart.timeScale().fitContent();
        strategyChart = chart; // Save reference for resize/theme changes if needed
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
