// History Management Module

class HistoryManager {
    constructor() {
        this.currentFilter = 'all';
        this.setupFilter();
    }

    setupFilter() {
        const filterSelect = document.getElementById('historyAccountFilter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.renderHistory();
            });
        }
    }

    // Update filter options
    updateFilterOptions() {
        const filterSelect = document.getElementById('historyAccountFilter');
        if (!filterSelect) return;

        const currentValue = filterSelect.value;
        const accounts = window.accountManager.getAllAccounts();

        // Clear existing options except "All Accounts"
        filterSelect.innerHTML = '<option value="all">All Accounts</option>';

        // Add account options
        accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.accountId;
            option.textContent = account.accountName;
            filterSelect.appendChild(option);
        });

        // Restore previous selection if still valid
        if (currentValue && accounts.some(acc => acc.accountId === currentValue)) {
            filterSelect.value = currentValue;
            this.currentFilter = currentValue;
        } else {
            filterSelect.value = 'all';
            this.currentFilter = 'all';
        }
    }

    // Render history list
    renderHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        const history = window.balanceManager.getHistoryByAccount(this.currentFilter);

        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <p>No balance history yet.</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = history.map(entry => {
            const account = window.accountManager.getAccount(entry.accountId);
            const accountName = account ? account.accountName : 'Unknown Account';
            const formattedBalance = this.formatCurrency(entry.balance);
            const formattedDate = this.formatDate(entry.inputDate);
            const memo = entry.memo ? `<div class="history-memo">${this.escapeHtml(entry.memo)}</div>` : '';

            return `
                <div class="history-item">
                    <div class="history-info">
                        <div class="history-account">${this.escapeHtml(accountName)}</div>
                        <div class="history-date">${formattedDate}</div>
                        ${memo}
                    </div>
                    <div class="history-amount">${formattedBalance}</div>
                </div>
            `;
        }).join('');
    }

    // Format currency
    formatCurrency(amount) {
        return '¥' + amount.toLocaleString('en-US');
    }

    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize history manager
window.historyManager = new HistoryManager();

