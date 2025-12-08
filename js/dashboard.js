// Dashboard Module

class Dashboard {
    constructor() {
        this.totalBalance = 0;
    }

    // Update total balance display
    updateTotalBalance() {
        const accounts = window.accountManager.getAllAccounts();
        this.totalBalance = accounts.reduce((sum, account) => {
            return sum + (account.latestBalance || 0);
        }, 0);

        const totalBalanceElement = document.getElementById('totalBalance');
        if (totalBalanceElement) {
            totalBalanceElement.textContent = this.formatCurrency(this.totalBalance);
        }
    }

    // Format currency
    formatCurrency(amount) {
        return '¥' + amount.toLocaleString('ja-JP');
    }
}

// Initialize dashboard
window.dashboard = new Dashboard();

