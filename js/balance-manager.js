// Balance Management Module

class BalanceManager {
    constructor() {
        this.balanceHistory = {};
        this.setupListeners();
    }

    setupListeners() {
        // Listen for balance history changes
        balanceHistoryRef.on('value', (snapshot) => {
            this.balanceHistory = snapshot.val() || {};
            if (window.historyManager) {
                window.historyManager.renderHistory();
            }
            if (window.charts) {
                window.charts.updateTrendChart();
            }
            if (window.accountManager) {
                window.accountManager.renderAccounts();
            }
        });
    }

    // Generate unique history ID
    generateHistoryId() {
        return 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Add balance history entry
    async addBalanceHistory(accountId, historyData) {
        try {
            const historyId = this.generateHistoryId();
            const historyEntry = {
                historyId: historyId,
                accountId: accountId,
                balance: parseFloat(historyData.balance),
                inputDate: historyData.inputDate || new Date().toISOString(),
                memo: historyData.memo || ''
            };

            // Add to balance history
            await balanceHistoryRef.child(accountId).child(historyId).set(historyEntry);

            // Update account's latest balance
            await accountsRef.child(accountId).update({
                latestBalance: historyEntry.balance
            });

            return historyId;
        } catch (error) {
            console.error('Error adding balance history:', error);
            throw error;
        }
    }

    // Get balance history for an account
    getAccountHistory(accountId) {
        const accountHistory = this.balanceHistory[accountId];
        if (!accountHistory) return [];
        
        return Object.values(accountHistory)
            .sort((a, b) => new Date(b.inputDate) - new Date(a.inputDate));
    }

    // Get all balance history
    getAllHistory() {
        const allHistory = [];
        Object.keys(this.balanceHistory).forEach(accountId => {
            const accountHistory = this.getAccountHistory(accountId);
            allHistory.push(...accountHistory);
        });
        return allHistory.sort((a, b) => new Date(b.inputDate) - new Date(a.inputDate));
    }

    // Get balance history filtered by account
    getHistoryByAccount(accountId) {
        if (accountId === 'all') {
            return this.getAllHistory();
        }
        return this.getAccountHistory(accountId);
    }
}

// Initialize balance manager
window.balanceManager = new BalanceManager();

