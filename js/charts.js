// Charts Module

class ChartsManager {
    constructor() {
        this.distributionChart = null;
        this.trendChart = null;
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
                                return `${label}: ¥${value.toLocaleString('ja-JP')} (${percentage}%)`;
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
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => '¥' + value.toLocaleString('ja-JP')
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
                                return `${label}: ¥${value.toLocaleString('ja-JP')}`;
                            }
                        }
                    }
                }
            }
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

        if (allHistory.length === 0) {
            this.trendChart.data.labels = [];
            this.trendChart.data.datasets = [];
            this.trendChart.update();
            return;
        }

        // Group history by date and calculate total balance per date
        const dateMap = new Map();
        
        allHistory.forEach(entry => {
            const date = new Date(entry.inputDate).toLocaleDateString('ja-JP');
            if (!dateMap.has(date)) {
                dateMap.set(date, {});
            }
            dateMap.get(date)[entry.accountId] = entry.balance;
        });

        // Calculate total balance for each date
        const sortedDates = Array.from(dateMap.keys()).sort((a, b) => {
            return new Date(a) - new Date(b);
        });

        const totalBalances = sortedDates.map(date => {
            const accountBalances = dateMap.get(date);
            return Object.values(accountBalances).reduce((sum, balance) => sum + balance, 0);
        });

        // Update chart
        this.trendChart.data.labels = sortedDates;
        this.trendChart.data.datasets = [{
            label: '総残高',
            data: totalBalances,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            fill: true
        }];
        this.trendChart.update();
    }
}

// Initialize charts manager
window.charts = new ChartsManager();

