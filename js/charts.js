// Charts Module

class ChartsManager {
    constructor() {
        this.distributionChart = null;
        this.trendChart = null;
        this.trendRange = 'all'; // week, month, year, all
        this.selectedSeries = ['total']; // selected dataset ids
        this.colorPalette = [
            '#667eea', '#764ba2', '#f093fb', '#4facfe', '#00c9ff',
            '#43e97b', '#fa709a', '#30cfd0', '#a8edea', '#fbd786',
            '#c79081', '#84fab0'
        ];
        this.initCharts();
    }

    // Initialize charts
    initCharts() {
        this.initDistributionChart();
        this.initTrendChart();
    }

    // Initialize distribution chart (pie chart)
    initDistributionChart() {
        const ctx = document.getElementById('distributionChart');
        if (!ctx) return;

        this.distributionChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#4facfe',
                        '#00f2fe',
                        '#43e97b',
                        '#fa709a',
                        '#fee140',
                        '#30cfd0',
                        '#a8edea'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ¥${value.toLocaleString('en-US')} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Initialize trend chart (line chart)
    initTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: (value) => '¥' + value.toLocaleString('en-US')
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y || 0;
                                return `${label}: ¥${value.toLocaleString('en-US')}`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Set range and refresh trend chart
    setTrendRange(range) {
        this.trendRange = range;
        this.updateTrendChart();
    }

    // Set visible series (array of ids: 'total' or accountId)
    setSeriesSelection(selectedIds) {
        if (!selectedIds || selectedIds.length === 0) {
            this.selectedSeries = ['total'];
        } else {
            this.selectedSeries = selectedIds;
        }
        this.updateTrendChart();
    }

    // Get range start date based on selected range
    getRangeStart() {
        if (this.trendRange === 'all') return null;
        const now = new Date();
        const rangeDaysMap = {
            week: 7,
            month: 31,
            year: 366
        };
        const days = rangeDaysMap[this.trendRange] || 99999;
        return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }

    formatDateKey(dateInput) {
        const d = new Date(dateInput);
        return d.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    // Filter history by selected range
    filterHistoryByRange(allHistory, rangeStart) {
        if (!rangeStart) return allHistory;

        return allHistory.filter(entry => {
            const entryDate = new Date(entry.inputDate);
            return entryDate >= rangeStart;
        });
    }

    // Update distribution chart
    updateDistributionChart() {
        if (!this.distributionChart) return;

        const accounts = window.accountManager.getAllAccounts();
        const labels = accounts.map(acc => acc.accountName);
        const data = accounts.map(acc => acc.latestBalance || 0);

        this.distributionChart.data.labels = labels;
        this.distributionChart.data.datasets[0].data = data;
        this.distributionChart.update();
    }

    // Update trend chart
    updateTrendChart() {
        if (!this.trendChart) return;

        const accounts = window.accountManager.getAllAccounts();
        const allHistory = window.balanceManager.getAllHistory();
        const rangeStart = this.getRangeStart();
        const filteredHistory = this.filterHistoryByRange(allHistory, rangeStart);

        if (filteredHistory.length === 0) {
            this.trendChart.data.labels = [];
            this.trendChart.data.datasets = [];
            this.trendChart.update();
            return;
        }

        // Sort history by date ascending
        const sortedHistory = [...filteredHistory].sort((a, b) => new Date(a.inputDate) - new Date(b.inputDate));

        // Determine start/end dates for the range
        const earliest = new Date(sortedHistory[0].inputDate);
        const latest = new Date(sortedHistory[sortedHistory.length - 1].inputDate);
        let startDate = earliest;
        if (rangeStart && rangeStart > startDate) {
            startDate = rangeStart;
        }

        // Group entries by date key
        const entriesByDate = new Map();
        sortedHistory.forEach(entry => {
            const key = this.formatDateKey(entry.inputDate);
            if (!entriesByDate.has(key)) entriesByDate.set(key, []);
            entriesByDate.get(key).push(entry);
        });

        // Fill missing dates and carry forward last balances
        const dateKeys = [];
        const totalBalances = [];
        const lastBalances = {};
        const accountSeries = new Map(); // accountId -> { name, data: [] }

        // Prepare series for each account
        accounts.forEach(acc => {
            accountSeries.set(acc.accountId, { id: acc.accountId, name: acc.accountName, data: [] });
        });

        let cursor = new Date(startDate);
        cursor.setHours(0, 0, 0, 0);
        latest.setHours(0, 0, 0, 0);

        while (cursor <= latest) {
            const key = this.formatDateKey(cursor);
            const dailyEntries = entriesByDate.get(key) || [];
            dailyEntries.forEach(entry => {
                lastBalances[entry.accountId] = entry.balance;
            });
            const total = Object.values(lastBalances).reduce((sum, bal) => sum + (bal || 0), 0);
            dateKeys.push(key);
            totalBalances.push(total);

            // push per-account value (carry forward)
            accountSeries.forEach((series, accId) => {
                const val = lastBalances[accId] !== undefined ? lastBalances[accId] : 0;
                series.data.push(val);
            });
            cursor.setDate(cursor.getDate() + 1);
        }

        // Build datasets: total + per account
        const datasets = [];
        // Total
        datasets.push({
            label: 'Total Balance',
            data: totalBalances,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            fill: true,
            _id: 'total'
        });
        // Accounts
        let colorIndex = 0;
        accountSeries.forEach((series) => {
            const color = this.colorPalette[colorIndex % this.colorPalette.length];
            datasets.push({
                label: series.name,
                data: series.data,
                borderColor: color,
                backgroundColor: color + '33',
                tension: 0.4,
                fill: false,
                _id: series.id
            });
            colorIndex += 1;
        });

        // Filter datasets based on selected series
        const allowed = new Set(this.selectedSeries);
        const finalDatasets = datasets.filter(ds => allowed.has(ds._id) || allowed.has('all'));

        // Y-axis dynamic range (padding around min/max) based on selected datasets
        const allSelectedValues = finalDatasets.flatMap(ds => ds.data || []);
        if (allSelectedValues.length > 0) {
            const minVal = Math.min(...allSelectedValues);
            const maxVal = Math.max(...allSelectedValues);
            const spread = Math.max(maxVal - minVal, 0);
            const padding = spread > 0 ? Math.max(Math.round(spread * 0.1), 1000) : Math.max(Math.round(maxVal * 0.05), 1000);
            const suggestedMin = Math.max(0, minVal - padding);
            const suggestedMax = maxVal + padding;
            this.trendChart.options.scales.y.suggestedMin = suggestedMin;
            this.trendChart.options.scales.y.suggestedMax = suggestedMax;
        }

        // Update chart
        this.trendChart.data.labels = dateKeys.map(key => new Date(key).toLocaleDateString('en-US'));
        this.trendChart.data.datasets = finalDatasets;
        this.trendChart.update();
    }
}

// Initialize charts manager
window.charts = new ChartsManager();

