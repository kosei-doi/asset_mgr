// Main Application Logic

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupTabs();
    setupRangeFilters();
    setupTrendSeriesSelect();
    setupModals();
    setupForms();
    setupEventListeners();
    
    // Initial render
    if (window.historyManager) {
        window.historyManager.updateFilterOptions();
    }
}

// Setup tab functionality
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            const targetPane = document.getElementById(targetTab + '-tab');
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });
}

// Setup trend series select (show/hide datasets)
function setupTrendSeriesSelect() {
    const select = document.getElementById('trendSeriesSelect');
    if (!select) return;

    const syncSelection = () => {
        const selected = select.value ? [select.value] : ['total'];
        if (window.charts && typeof window.charts.setSeriesSelection === 'function') {
            window.charts.setSeriesSelection(selected);
        }
    };

    select.addEventListener('change', syncSelection);

    // Initial population with current accounts
    refreshTrendSeriesOptions();
    syncSelection();
}

function refreshTrendSeriesOptions() {
    const select = document.getElementById('trendSeriesSelect');
    if (!select) return;
    const currentValue = select.value || 'total';

    // Clear
    select.innerHTML = '';
    // Total
    const totalOpt = document.createElement('option');
    totalOpt.value = 'total';
    totalOpt.textContent = '総残高';
    totalOpt.selected = currentValue === 'total';
    select.appendChild(totalOpt);

    // Accounts
    const accounts = window.accountManager ? window.accountManager.getAllAccounts() : [];
    accounts.forEach(acc => {
        const opt = document.createElement('option');
        opt.value = acc.accountId;
        opt.textContent = acc.accountName;
        if (currentValue === acc.accountId) opt.selected = true;
        select.appendChild(opt);
    });
}

// Setup trend range filter buttons
function setupRangeFilters() {
    const rangeButtons = document.querySelectorAll('.range-btn');
    if (!rangeButtons.length) return;

    rangeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const range = btn.getAttribute('data-range');
            rangeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (window.charts && typeof window.charts.setTrendRange === 'function') {
                window.charts.setTrendRange(range);
            }
        });
    });
}

// Setup modal functionality
function setupModals() {
    // Add Account Modal
    const addAccountModal = document.getElementById('addAccountModal');
    const addAccountBtn = document.getElementById('addAccountBtn');
    const addAccountBtn2 = document.getElementById('addAccountBtn2');
    const cancelAddAccount = document.getElementById('cancelAddAccount');

    const openAddAccountModal = () => {
        addAccountModal.classList.add('show');
    };

    if (addAccountBtn) {
        addAccountBtn.addEventListener('click', openAddAccountModal);
    }
    if (addAccountBtn2) {
        addAccountBtn2.addEventListener('click', openAddAccountModal);
    }

    if (cancelAddAccount) {
        cancelAddAccount.addEventListener('click', () => {
            addAccountModal.classList.remove('show');
            document.getElementById('addAccountForm').reset();
        });
    }

    // Edit Account Modal
    const editAccountModal = document.getElementById('editAccountModal');
    const cancelEditAccount = document.getElementById('cancelEditAccount');

    if (cancelEditAccount) {
        cancelEditAccount.addEventListener('click', () => {
            editAccountModal.classList.remove('show');
        });
    }

    // Update Balance Modal
    const updateBalanceModal = document.getElementById('updateBalanceModal');
    const cancelUpdateBalance = document.getElementById('cancelUpdateBalance');

    if (cancelUpdateBalance) {
        cancelUpdateBalance.addEventListener('click', () => {
            updateBalanceModal.classList.remove('show');
            document.getElementById('updateBalanceForm').reset();
        });
    }

    // Close modals when clicking outside
    [addAccountModal, editAccountModal, updateBalanceModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        }
    });

    // Close modals with X button
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeBtn.closest('.modal').classList.remove('show');
        });
    });
}

// Setup form submissions
function setupForms() {
    // Add Account Form
    const addAccountForm = document.getElementById('addAccountForm');
    if (addAccountForm) {
        addAccountForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const accountName = document.getElementById('accountName').value.trim();
            const accountType = document.getElementById('accountType').value;
            const initialBalance = parseFloat(document.getElementById('initialBalance').value) || 0;

            if (!accountName || !accountType) {
                alert('すべての必須項目を入力してください。');
                return;
            }

            try {
                await window.accountManager.addAccount({
                    accountName,
                    accountType,
                    initialBalance
                });

                document.getElementById('addAccountModal').classList.remove('show');
                addAccountForm.reset();
                
                // Update history filter options
                if (window.historyManager) {
                    window.historyManager.updateFilterOptions();
                }
            } catch (error) {
                alert('口座の追加中にエラーが発生しました。もう一度お試しください。');
                console.error(error);
            }
        });
    }

    // Edit Account Form
    const editAccountForm = document.getElementById('editAccountForm');
    if (editAccountForm) {
        editAccountForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const accountId = document.getElementById('editAccountId').value;
            const accountName = document.getElementById('editAccountName').value.trim();
            const accountType = document.getElementById('editAccountType').value;

            if (!accountName || !accountType) {
                alert('すべての必須項目を入力してください。');
                return;
            }

            try {
                await window.accountManager.updateAccount(accountId, {
                    accountName,
                    accountType
                });

                document.getElementById('editAccountModal').classList.remove('show');
                
                // Update history filter options
                if (window.historyManager) {
                    window.historyManager.updateFilterOptions();
                }
            } catch (error) {
                alert('口座の更新中にエラーが発生しました。もう一度お試しください。');
                console.error(error);
            }
        });
    }

    // Update Balance Form
    const updateBalanceForm = document.getElementById('updateBalanceForm');
    if (updateBalanceForm) {
        updateBalanceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const accountId = document.getElementById('updateBalanceAccountId').value;
            const newBalance = parseFloat(document.getElementById('newBalance').value);
            const balanceDate = document.getElementById('balanceDate').value;
            const balanceMemo = document.getElementById('balanceMemo').value.trim();

            if (isNaN(newBalance) || newBalance < 0) {
                alert('有効な残高を入力してください。');
                return;
            }

            if (!balanceDate) {
                alert('日付を選択してください。');
                return;
            }

            try {
                // Convert date to ISO string
                const inputDate = new Date(balanceDate + 'T00:00:00').toISOString();

                await window.balanceManager.addBalanceHistory(accountId, {
                    balance: newBalance,
                    inputDate: inputDate,
                    memo: balanceMemo
                });

                document.getElementById('updateBalanceModal').classList.remove('show');
                updateBalanceForm.reset();
            } catch (error) {
                alert('残高の更新中にエラーが発生しました。もう一度お試しください。');
                console.error(error);
            }
        });
    }
}

// Setup additional event listeners
function setupEventListeners() {
    // Update history filter when accounts change
    if (window.accountManager) {
        const originalRender = window.accountManager.renderAccounts.bind(window.accountManager);
        window.accountManager.renderAccounts = function() {
            originalRender();
            if (window.historyManager) {
                window.historyManager.updateFilterOptions();
            }
            refreshTrendSeriesOptions();
        };
    }
}

