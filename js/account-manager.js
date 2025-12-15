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
                        memo: '初期残高'
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
            if (confirm('この口座を削除してもよろしいですか？残高履歴もすべて削除されます。')) {
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
                    <p>まだ口座がありません。「口座を追加」をクリックして始めましょう。</p>
                </div>
            `;
            return;
        }

        accountsGrid.innerHTML = accounts.map(account => {
            const formattedBalance = this.formatCurrency(account.latestBalance || 0);
            const createdDate = new Date(account.createdAt).toLocaleDateString();

            // 前回比計算
            let trendClass = 'trend-neutral';
            let trendText = '前回比: -';
            if (window.balanceManager) {
                const history = window.balanceManager.getAccountHistory(account.accountId);
                const latest = history.length > 0 ? history[0] : null;
                const prevEntry = history.length > 1 ? history[1] : null;
                if (latest && prevEntry) {
                    const prev = prevEntry.balance || 0;
                    const curr = latest.balance || 0;
                    const diff = curr - prev;
                    const pct = prev !== 0 ? (diff / prev) * 100 : null;
                    if (diff > 0) {
                        trendClass = 'trend-up';
                        trendText = `前回比: +${this.formatCurrency(Math.abs(diff))}${pct !== null ? ` (+${pct.toFixed(1)}%)` : ''}`;
                    } else if (diff < 0) {
                        trendClass = 'trend-down';
                        trendText = `前回比: -${this.formatCurrency(Math.abs(diff))}${pct !== null ? ` (-${Math.abs(pct).toFixed(1)}%)` : ''}`;
                    } else {
                        trendClass = 'trend-neutral';
                        trendText = '前回比: 変化なし';
                    }
                } else if (latest) {
                    trendClass = 'trend-neutral';
                    trendText = '前回比: 初回データ';
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
                    <div class="account-meta">作成日: ${createdDate}</div>
                    <div class="account-actions">
                        <button class="btn btn-primary btn-small" onclick="window.accountManager.openUpdateBalanceModal('${account.accountId}')">
                            残高を更新
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="window.accountManager.openEditAccountModal('${account.accountId}')">
                            編集
                        </button>
                        <button class="btn btn-danger btn-small" onclick="window.accountManager.deleteAccount('${account.accountId}')">
                            削除
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
        return '¥' + amount.toLocaleString('ja-JP');
    }

    // Get Japanese account type name
    getAccountTypeName(accountType) {
        const typeMap = {
            'Savings': '普通預金',
            'Investment': '投資'
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

