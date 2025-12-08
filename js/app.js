// Main Application Logic

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupModals();
    setupForms();
    setupEventListeners();
    
    // Initial render
    if (window.historyManager) {
        window.historyManager.updateFilterOptions();
    }
}

// Setup modal functionality
function setupModals() {
    // Add Account Modal
    const addAccountModal = document.getElementById('addAccountModal');
    const addAccountBtn = document.getElementById('addAccountBtn');
    const cancelAddAccount = document.getElementById('cancelAddAccount');

    if (addAccountBtn) {
        addAccountBtn.addEventListener('click', () => {
            addAccountModal.classList.add('show');
        });
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
                alert('Please fill in all required fields.');
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
                alert('Error adding account. Please try again.');
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
                alert('Please fill in all required fields.');
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
                alert('Error updating account. Please try again.');
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
                alert('Please enter a valid balance amount.');
                return;
            }

            if (!balanceDate) {
                alert('Please select a date.');
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
                alert('Error updating balance. Please try again.');
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
        };
    }
}

