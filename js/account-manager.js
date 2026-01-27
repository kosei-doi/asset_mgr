// Account Management Module

class AccountManager {
    constructor() {
        this.accounts = {};
        this.setupListeners();
    }

    setupListeners() {
        // Listen for account changes
        accountsRef.on('value', (snapshot) => {
            this.accounts = snapshot.val() || {};
            this.renderAccounts();
            if (window.dashboard) {
                window.dashboard.updateTotalBalance();
            }
            if (window.charts) {
                window.charts.updateDistributionChart();
                window.charts.updateTrendChart();
            }
        });
    }

    // Generate unique account ID
    generateAccountId() {
        return 'acc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Add new account
    async addAccount(accountData) {
        try {
            const accountId = this.generateAccountId();
            const account = {
                accountId: accountId,
                accountName: accountData.accountName,
                accountType: accountData.accountType,
                createdAt: new Date().toISOString(),
                latestBalance: accountData.initialBalance || 0
            };

            await accountsRef.child(accountId).set(account);

            // If initial balance is provided, create history entry
            if (accountData.initialBalance && accountData.initialBalance > 0) {
                if (window.balanceManager) {
                    await window.balanceManager.addBalanceHistory(accountId, {
                        balance: accountData.initialBalance,
                        inputDate: new Date().toISOString(),
                        memo: 'Initial balance'
                    });
                }
            }

            return accountId;
        } catch (error) {
            console.error('Error adding account:', error);
            throw error;
        }
    }

    // Update account
    async updateAccount(accountId, accountData) {
        try {
            const updates = {
                accountName: accountData.accountName,
                accountType: accountData.accountType
            };
            await accountsRef.child(accountId).update(updates);
        } catch (error) {
            console.error('Error updating account:', error);
            throw error;
        }
    }

    // Delete account
    async deleteAccount(accountId) {
        try {
            if (confirm('Delete this account? All balance history will also be removed.')) {
                await accountsRef.child(accountId).remove();
                await balanceHistoryRef.child(accountId).remove();
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            throw error;
        }
    }

    // Get account by ID
    getAccount(accountId) {
        return this.accounts[accountId] || null;
    }

    // Get all accounts
    getAllAccounts() {
        return Object.values(this.accounts);
    }

    // Render accounts in the UI
    renderAccounts() {
        const accountsGrid = document.getElementById('accountsGrid');
        if (!accountsGrid) return;

        const accounts = this.getAllAccounts();

        if (accounts.length === 0) {
            accountsGrid.innerHTML = `
                <div class="empty-state">
                    <p>No accounts yet. Click "Add Account" to get started.</p>
                </div>
            `;
            return;
        }

        accountsGrid.innerHTML = accounts.map(account => {
            const formattedBalance = this.formatCurrency(account.latestBalance || 0);
            const createdDate = new Date(account.createdAt).toLocaleDateString();

            // Previous vs latest calculation
            let trendClass = 'trend-neutral';
            let trendText = '-';
            if (window.balanceManager) {
                const history = window.balanceManager.getAccountHistory(account.accountId);
                const latest = history.length > 0 ? history[0] : null;
                const prevEntry = history.length > 1 ? history[1] : null;
                if (latest && prevEntry) {
                    const prev = prevEntry.balance || 0;
                    const curr = latest.balance || 0;
                    const diff = curr - prev;
                    const pct = prev !== 0 ? (diff / prev) * 100 : null;
                    // Days between previous and latest entry
                    let daysSincePrev = null;
                    if (prevEntry.inputDate) {
                        const prevDate = new Date(prevEntry.inputDate);
                        const latestDate = new Date(latest.inputDate || latest.createdAt || Date.now());
                        const msPerDay = 1000 * 60 * 60 * 24;
                        daysSincePrev = Math.max(0, Math.floor((latestDate - prevDate) / msPerDay));
                    }
                    const daysText = daysSincePrev !== null ? `(${daysSincePrev} days)` : '';

                    if (diff > 0) {
                        trendClass = 'trend-up';
                        const pctText = pct !== null ? ` (+${pct.toFixed(1)}%)` : '';
                        trendText = `+${this.formatCurrency(Math.abs(diff))}${pctText} ${daysText}`.trim();
                    } else if (diff < 0) {
                        trendClass = 'trend-down';
                        const pctText = pct !== null ? ` (-${Math.abs(pct).toFixed(1)}%)` : '';
                        trendText = `-${this.formatCurrency(Math.abs(diff))}${pctText} ${daysText}`.trim();
                    } else {
                        trendClass = 'trend-neutral';
                        trendText = `No change ${daysText}`.trim();
                    }
                } else if (latest) {
                    trendClass = 'trend-neutral';
                    trendText = 'First entry';
                }
            }
            
            return `
                <div class="account-card">
                    <div class="account-header">
                        <div>
                            <div class="account-name">${this.escapeHtml(account.accountName)}</div>
                            <span class="account-type">${this.escapeHtml(this.getAccountTypeName(account.accountType))}</span>
                        </div>
                    </div>
                    <div class="account-balance">${formattedBalance}</div>
                    <div class="account-trend ${trendClass}">${trendText}</div>
                    <div class="account-meta">Created: ${createdDate}</div>
                    <div class="account-actions">
                        <button class="btn btn-primary btn-small" onclick="window.accountManager.openUpdateBalanceModal('${account.accountId}')">
                            Update Balance
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="window.accountManager.openEditAccountModal('${account.accountId}')">
                            Edit
                        </button>
                        <button class="btn btn-danger btn-small" onclick="window.accountManager.deleteAccount('${account.accountId}')">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Open edit account modal
    openEditAccountModal(accountId) {
        const account = this.getAccount(accountId);
        if (!account) return;

        document.getElementById('editAccountId').value = accountId;
        document.getElementById('editAccountName').value = account.accountName;
        document.getElementById('editAccountType').value = account.accountType;

        const modal = document.getElementById('editAccountModal');
        modal.classList.add('show');
    }

    // Open update balance modal
    openUpdateBalanceModal(accountId) {
        const account = this.getAccount(accountId);
        if (!account) return;

        document.getElementById('updateBalanceAccountId').value = accountId;
        document.getElementById('currentBalance').value = this.formatCurrency(account.latestBalance || 0);
        document.getElementById('newBalance').value = '';
        document.getElementById('balanceDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('balanceMemo').value = '';

        const modal = document.getElementById('updateBalanceModal');
        modal.classList.add('show');
    }

    // Format currency
    formatCurrency(amount) {
        return '¥' + amount.toLocaleString('en-US');
    }

    // Map account type to display label
    getAccountTypeName(accountType) {
        const typeMap = {
            'Savings': 'Savings',
            'Investment': 'Investment'
        };
        return typeMap[accountType] || accountType;
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize account manager
window.accountManager = new AccountManager();

