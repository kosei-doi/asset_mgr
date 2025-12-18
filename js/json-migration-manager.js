// JSON-BASED FIREBASE DATABASE MIGRATION MANAGER
// Safely migrate data using JSON exports instead of live database connections

class JSONMigrationManager {
    constructor() {
        this.sourceData = null;
        this.destinationData = null;
        this.migrationStats = {
            accountsProcessed: 0,
            historyEntriesProcessed: 0,
            accountsMigrated: 0,
            historyEntriesMigrated: 0,
            accountsSkipped: 0,
            historyEntriesSkipped: 0,
            errors: []
        };
        this.userId = null; // For destination database structure
    }

    // Load JSON data from files
    async loadSourceData() {
        try {
            this.log('Loading source JSON data...');
            const response = await fetch('./asset-3a5ef-default-rtdb-export (1).json');
            if (!response.ok) {
                throw new Error(`Failed to load source JSON: ${response.status}`);
            }
            this.sourceData = await response.json();
            this.log('Source data loaded successfully');

            // Extract accounts and balanceHistory
            this.sourceAccounts = this.sourceData.accounts || {};
            this.sourceHistory = this.sourceData.balanceHistory || {};

            this.migrationStats.accountsProcessed = Object.keys(this.sourceAccounts).length;
            this.migrationStats.historyEntriesProcessed = Object.values(this.sourceHistory).reduce(
                (total, accountHistory) => total + Object.keys(accountHistory || {}).length, 0
            );

            this.log(`Source data: ${this.migrationStats.accountsProcessed} accounts, ${this.migrationStats.historyEntriesProcessed} history entries`);

        } catch (error) {
            this.log(`Error loading source data: ${error.message}`, 'error');
            throw error;
        }
    }

    async loadDestinationData() {
        try {
            this.log('Loading destination JSON data...');
            const response = await fetch('./manager-8ac68-default-rtdb-export.json');
            if (!response.ok) {
                // If destination doesn't exist, assume it's empty
                this.log('Destination JSON not found - assuming empty database');
                this.destinationData = { assets: {} };
                return;
            }
            this.destinationData = await response.json();
            this.log('Destination data loaded successfully');

            // Extract user ID and data from nested structure
            const assets = this.destinationData.assets || {};
            const userIds = Object.keys(assets);
            if (userIds.length > 0) {
                this.userId = userIds[0]; // Assume first user
                const userData = assets[this.userId] || {};
                this.destAccounts = userData.accounts || {};
                this.destHistory = userData.balanceHistory || {};

                const destAccountCount = Object.keys(this.destAccounts).length;
                const destHistoryCount = Object.values(this.destHistory).reduce(
                    (total, accountHistory) => total + Object.keys(accountHistory || {}).length, 0
                );

                this.log(`Destination data: ${destAccountCount} accounts, ${destHistoryCount} history entries for user ${this.userId}`);
            } else {
                this.destAccounts = {};
                this.destHistory = {};
                this.log('Destination database appears empty');
            }

        } catch (error) {
            this.log(`Error loading destination data: ${error.message}`, 'error');
            // Assume empty destination
            this.destinationData = { assets: {} };
            this.destAccounts = {};
            this.destHistory = {};
        }
    }

    // Data structure transformation
    transformAccountForDestination(sourceAccount) {
        // Transform account structure if needed
        return {
            accountId: sourceAccount.accountId,
            accountName: sourceAccount.accountName,
            accountType: sourceAccount.accountType,
            createdAt: sourceAccount.createdAt,
            latestBalance: sourceAccount.latestBalance
        };
    }

    transformHistoryForDestination(sourceHistoryEntry) {
        // Transform history entry structure if needed
        return {
            accountId: sourceHistoryEntry.accountId,
            balance: sourceHistoryEntry.balance,
            historyId: sourceHistoryEntry.historyId,
            inputDate: sourceHistoryEntry.inputDate,
            memo: sourceHistoryEntry.memo || ""
        };
    }

    // Comparison and migration logic
    compareData() {
        this.log('Comparing source and destination data...');

        const comparison = {
            accountsToMigrate: [],
            accountsToUpdate: [],
            accountsMatching: [],
            historyToMigrate: [],
            historyToUpdate: [],
            historyMatching: []
        };

        // Compare accounts
        for (const [accountId, sourceAccount] of Object.entries(this.sourceAccounts)) {
            const destAccount = this.destAccounts[accountId];

            if (!destAccount) {
                comparison.accountsToMigrate.push(accountId);
            } else if (JSON.stringify(this.transformAccountForDestination(sourceAccount)) !==
                      JSON.stringify(destAccount)) {
                comparison.accountsToUpdate.push(accountId);
            } else {
                comparison.accountsMatching.push(accountId);
            }
        }

        // Compare balance history
        for (const [accountId, sourceAccountHistory] of Object.entries(this.sourceHistory)) {
            if (!this.destHistory[accountId]) {
                // Entire account history missing
                Object.keys(sourceAccountHistory).forEach(historyId => {
                    comparison.historyToMigrate.push(`${accountId}/${historyId}`);
                });
            } else {
                // Compare individual history entries
                for (const [historyId, sourceEntry] of Object.entries(sourceAccountHistory)) {
                    const destEntry = this.destHistory[accountId][historyId];

                    if (!destEntry) {
                        comparison.historyToMigrate.push(`${accountId}/${historyId}`);
                    } else if (JSON.stringify(this.transformHistoryForDestination(sourceEntry)) !==
                              JSON.stringify(destEntry)) {
                        comparison.historyToUpdate.push(`${accountId}/${historyId}`);
                    } else {
                        comparison.historyMatching.push(`${accountId}/${historyId}`);
                    }
                }
            }
        }

        this.log(`Comparison complete:`);
        this.log(`  Accounts: ${comparison.accountsToMigrate.length} to migrate, ${comparison.accountsToUpdate.length} to update, ${comparison.accountsMatching.length} matching`);
        this.log(`  History: ${comparison.historyToMigrate.length} to migrate, ${comparison.historyToUpdate.length} to update, ${comparison.historyMatching.length} matching`);

        return comparison;
    }

    // Generate Firebase import data
    generateFirebaseImportData(comparison) {
        this.log('Generating Firebase import data...');

        // Start with COMPLETE destination data (deep copy)
        const importData = JSON.parse(JSON.stringify(this.destinationData));

        // Flatten structure: move data from userId to direct assets level
        if (this.userId && importData.assets && importData.assets[this.userId]) {
            // Move user data to assets root level
            const userData = importData.assets[this.userId];
            importData.assets.accounts = userData.accounts || {};
            importData.assets.balanceHistory = userData.balanceHistory || {};
            // Remove the userId level
            delete importData.assets[this.userId];
            this.log(`Flattened structure: moved data from user ${this.userId} to assets root level`);
        }

        // Ensure assets structure exists at root level
        if (!importData.assets) {
            importData.assets = {};
        }
        if (!importData.assets.accounts) {
            importData.assets.accounts = {};
        }
        if (!importData.assets.balanceHistory) {
            importData.assets.balanceHistory = {};
        }

        // Add/update accounts
        const accountsToProcess = [...comparison.accountsToMigrate, ...comparison.accountsToUpdate];
        accountsToProcess.forEach(accountId => {
            const sourceAccount = this.sourceAccounts[accountId];
            if (sourceAccount) {
                importData.assets.accounts[accountId] = this.transformAccountForDestination(sourceAccount);
                this.migrationStats.accountsMigrated++;
            }
        });

        // Add/update history entries
        const historyToProcess = [...comparison.historyToMigrate, ...comparison.historyToUpdate];
        historyToProcess.forEach(historyPath => {
            const [accountId, historyId] = historyPath.split('/');
            const sourceEntry = this.sourceHistory[accountId]?.[historyId];
            if (sourceEntry) {
                if (!importData.assets.balanceHistory[accountId]) {
                    importData.assets.balanceHistory[accountId] = {};
                }
                importData.assets.balanceHistory[accountId][historyId] = this.transformHistoryForDestination(sourceEntry);
                this.migrationStats.historyEntriesMigrated++;
            }
        });

        this.log(`Generated import data with ${Object.keys(importData.assets.accounts).length} accounts and ${
            Object.values(importData.assets.balanceHistory).reduce((total, hist) => total + Object.keys(hist).length, 0)
        } history entries`);

        return importData;
    }

    // Export data for Firebase import
    exportForFirebase(importData) {
        const jsonString = JSON.stringify(importData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `firebase-import-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.log(`Export file generated: firebase-import-${new Date().toISOString().split('T')[0]}.json`);
    }

    // Validate data integrity
    validateMigration(importData) {
        this.log('Validating migration data integrity...');

        const assetsData = importData.assets;
        if (!assetsData) {
            throw new Error('No assets data found in import data');
        }

        const accounts = assetsData.accounts || {};
        const history = assetsData.balanceHistory || {};

        // Validate account structure
        for (const [accountId, account] of Object.entries(accounts)) {
            const requiredFields = ['accountId', 'accountName', 'accountType', 'createdAt', 'latestBalance'];
            for (const field of requiredFields) {
                if (!(field in account)) {
                    throw new Error(`Account ${accountId} missing required field: ${field}`);
                }
            }
            if (typeof account.latestBalance !== 'number') {
                throw new Error(`Account ${accountId} has invalid balance: ${account.latestBalance}`);
            }
        }

        // Validate history structure
        for (const [accountId, accountHistory] of Object.entries(history)) {
            for (const [historyId, entry] of Object.entries(accountHistory)) {
                const requiredFields = ['accountId', 'balance', 'historyId', 'inputDate'];
                for (const field of requiredFields) {
                    if (!(field in entry)) {
                        throw new Error(`History ${accountId}/${historyId} missing required field: ${field}`);
                    }
                }
                if (typeof entry.balance !== 'number') {
                    throw new Error(`History ${accountId}/${historyId} has invalid balance: ${entry.balance}`);
                }
            }
        }

        this.log('Data validation passed ✅');
        return true;
    }

    // Main migration workflow
    async executeMigrationWorkflow(options = {}) {
        try {
            this.log('=== JSON-BASED MIGRATION WORKFLOW STARTED ===');

            // Step 1: Load data
            await this.loadSourceData();
            await this.loadDestinationData();

            // Step 2: Compare data
            const comparison = this.compareData();

            // Step 3: Check if migration is needed
            const totalChanges = comparison.accountsToMigrate.length + comparison.accountsToUpdate.length +
                               comparison.historyToMigrate.length + comparison.historyToUpdate.length;

            if (totalChanges === 0) {
                this.log('✅ No migration needed - all data already synchronized');
                return { success: true, changes: 0, message: 'Data already synchronized' };
            }

            this.log(`📋 Migration needed: ${totalChanges} changes required`);

            if (!options.skipConfirmation) {
                const confirmed = confirm(`Migration will make ${totalChanges} changes:\n\n` +
                    `• ${comparison.accountsToMigrate.length} new accounts\n` +
                    `• ${comparison.accountsToUpdate.length} account updates\n` +
                    `• ${comparison.historyToMigrate.length} new history entries\n` +
                    `• ${comparison.historyToUpdate.length} history updates\n\n` +
                    `Continue with migration?`);
                if (!confirmed) {
                    this.log('Migration cancelled by user');
                    return { success: false, changes: 0, message: 'Cancelled by user' };
                }
            }

            // Step 4: Generate import data
            const importData = this.generateFirebaseImportData(comparison);

            // Step 5: Validate
            this.validateMigration(importData);

            // Step 6: Export or return
            if (options.returnData) {
                this.log('=== MIGRATION WORKFLOW COMPLETED - DATA GENERATED ===');
                return {
                    success: true,
                    changes: totalChanges,
                    importData: importData,
                    comparison: comparison
                };
            } else {
                this.exportForFirebase(importData);
                this.log('=== MIGRATION WORKFLOW COMPLETED - FILE EXPORTED ===');
                return {
                    success: true,
                    changes: totalChanges,
                    message: 'Import file generated successfully',
                    comparison: comparison
                };
            }

        } catch (error) {
            this.log(`=== MIGRATION WORKFLOW FAILED ===`, 'error');
            this.log(`Error: ${error.message}`, 'error');
            throw error;
        }
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
        console.log(logEntry);

        // Also log to UI if available
        if (window.logToUI) {
            window.logToUI(message, type);
        }
    }
}

// Export for global use
window.JSONMigrationManager = JSONMigrationManager;
