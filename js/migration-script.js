// SAFE FIREBASE DATABASE MIGRATION SCRIPT
// This script ensures NO DATA LOSS from the source database
// and provides comprehensive validation and error handling

const { sourceDatabase, destinationDatabase, expectedDataStructure } = require('./migration-config.js');

class FirebaseMigrationManager {
    constructor() {
        this.migrationStats = {
            totalAccounts: 0,
            totalHistoryEntries: 0,
            migratedAccounts: 0,
            migratedHistoryEntries: 0,
            errors: [],
            validationErrors: []
        };
        this.backupData = null;
        this.migrationLog = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
        console.log(logEntry);
        this.migrationLog.push(logEntry);
    }

    // STEP 1: Read and validate source data (READ-ONLY)
    async readSourceData() {
        this.log('Starting source data reading...');

        try {
            const [accountsSnapshot, balanceHistorySnapshot] = await Promise.all([
                sourceDatabase.ref('accounts').once('value'),
                sourceDatabase.ref('balanceHistory').once('value')
            ]);

            const accounts = accountsSnapshot.val() || {};
            const balanceHistory = balanceHistorySnapshot.val() || {};

            // Validate data structure
            const validationResult = this.validateDataStructure(accounts, balanceHistory);
            if (!validationResult.isValid) {
                this.migrationStats.validationErrors = validationResult.errors;
                throw new Error('Source data validation failed');
            }

            // Count data
            this.migrationStats.totalAccounts = Object.keys(accounts).length;
            this.migrationStats.totalHistoryEntries = Object.values(balanceHistory).reduce(
                (total, accountHistory) => total + Object.keys(accountHistory || {}).length,
                0
            );

            this.log(`Source data read successfully. Accounts: ${this.migrationStats.totalAccounts}, History entries: ${this.migrationStats.totalHistoryEntries}`);

            // Create backup copy
            this.backupData = {
                accounts: JSON.parse(JSON.stringify(accounts)), // Deep copy
                balanceHistory: JSON.parse(JSON.stringify(balanceHistory))
            };

            return { accounts, balanceHistory };
        } catch (error) {
            this.log(`Error reading source data: ${error.message}`, 'error');
            throw error;
        }
    }

    // Validate data structure against expected schema
    validateDataStructure(accounts, balanceHistory) {
        const errors = [];
        let isValid = true;

        // Validate accounts structure
        for (const [accountId, accountData] of Object.entries(accounts)) {
            if (typeof accountData !== 'object' || accountData === null) {
                errors.push(`Account ${accountId}: Invalid account data structure`);
                isValid = false;
                continue;
            }

            const requiredFields = ['name', 'type', 'balance', 'currency', 'createdAt', 'updatedAt'];
            for (const field of requiredFields) {
                if (!(field in accountData)) {
                    errors.push(`Account ${accountId}: Missing required field '${field}'`);
                    isValid = false;
                }
            }

            if (typeof accountData.balance !== 'number') {
                errors.push(`Account ${accountId}: Balance must be a number`);
                isValid = false;
            }
        }

        // Validate balance history structure
        for (const [accountId, accountHistory] of Object.entries(balanceHistory)) {
            if (typeof accountHistory !== 'object' || accountHistory === null) {
                errors.push(`BalanceHistory ${accountId}: Invalid structure`);
                isValid = false;
                continue;
            }

            for (const [historyId, historyEntry] of Object.entries(accountHistory)) {
                const requiredHistoryFields = ['amount', 'type', 'description', 'timestamp', 'balanceBefore', 'balanceAfter'];
                for (const field of requiredHistoryFields) {
                    if (!(field in historyEntry)) {
                        errors.push(`History ${accountId}/${historyId}: Missing required field '${field}'`);
                        isValid = false;
                    }
                }

                if (typeof historyEntry.amount !== 'number') {
                    errors.push(`History ${accountId}/${historyId}: Amount must be a number`);
                    isValid = false;
                }
            }
        }

        return { isValid, errors };
    }

    // STEP 2: Verify destination database is empty or handle conflicts
    async verifyDestinationEmpty() {
        this.log('Verifying destination database state...');

        try {
            const [destAccountsSnapshot, destHistorySnapshot] = await Promise.all([
                destinationDatabase.ref('accounts').once('value'),
                destinationDatabase.ref('balanceHistory').once('value')
            ]);

            const destAccounts = destAccountsSnapshot.val() || {};
            const destHistory = destHistorySnapshot.val() || {};

            const destAccountsCount = Object.keys(destAccounts).length;
            const destHistoryCount = Object.values(destHistory).reduce(
                (total, accountHistory) => total + Object.keys(accountHistory || {}).length,
                0
            );

            if (destAccountsCount > 0 || destHistoryCount > 0) {
                const message = `Destination database is not empty! Contains ${destAccountsCount} accounts and ${destHistoryCount} history entries.`;
                this.log(message, 'warning');
                throw new Error(message + ' Please ensure destination is empty before migration.');
            }

            this.log('Destination database verified as empty.');
        } catch (error) {
            this.log(`Error verifying destination: ${error.message}`, 'error');
            throw error;
        }
    }

    // STEP 3: Migrate data in safe batches
    async migrateData(sourceData) {
        this.log('Starting data migration...');

        const { accounts, balanceHistory } = sourceData;
        const batchSize = 10; // Process 10 accounts at a time

        try {
            // Migrate accounts in batches
            await this.migrateAccountsInBatches(accounts, batchSize);

            // Migrate balance history in batches
            await this.migrateBalanceHistoryInBatches(balanceHistory, batchSize);

            this.log('Data migration completed successfully.');
        } catch (error) {
            this.log(`Migration failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async migrateAccountsInBatches(accounts, batchSize) {
        const accountIds = Object.keys(accounts);
        const batches = [];

        for (let i = 0; i < accountIds.length; i += batchSize) {
            batches.push(accountIds.slice(i, i + batchSize));
        }

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            this.log(`Migrating accounts batch ${i + 1}/${batches.length} (${batch.length} accounts)`);

            const updates = {};
            batch.forEach(accountId => {
                updates[`accounts/${accountId}`] = accounts[accountId];
            });

            await destinationDatabase.ref().update(updates);
            this.migrationStats.migratedAccounts += batch.length;
            this.log(`Batch ${i + 1} completed. Total migrated accounts: ${this.migrationStats.migratedAccounts}`);
        }
    }

    async migrateBalanceHistoryInBatches(balanceHistory, batchSize) {
        const accountIds = Object.keys(balanceHistory);
        const batches = [];

        for (let i = 0; i < accountIds.length; i += batchSize) {
            batches.push(accountIds.slice(i, i + batchSize));
        }

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            this.log(`Migrating balance history batch ${i + 1}/${batches.length} (${batch.length} accounts)`);

            const updates = {};
            batch.forEach(accountId => {
                const accountHistory = balanceHistory[accountId];
                Object.keys(accountHistory).forEach(historyId => {
                    updates[`balanceHistory/${accountId}/${historyId}`] = accountHistory[historyId];
                    this.migrationStats.migratedHistoryEntries++;
                });
            });

            await destinationDatabase.ref().update(updates);
            this.log(`History batch ${i + 1} completed. Total migrated history entries: ${this.migrationStats.migratedHistoryEntries}`);
        }
    }

    // STEP 4: Verify migration integrity
    async verifyMigration() {
        this.log('Starting migration verification...');

        try {
            // Read destination data
            const [destAccountsSnapshot, destHistorySnapshot] = await Promise.all([
                destinationDatabase.ref('accounts').once('value'),
                destinationDatabase.ref('balanceHistory').once('value')
            ]);

            const destAccounts = destAccountsSnapshot.val() || {};
            const destHistory = destHistorySnapshot.val() || {};

            const destAccountsCount = Object.keys(destAccounts).length;
            const destHistoryCount = Object.values(destHistory).reduce(
                (total, accountHistory) => total + Object.keys(accountHistory || {}).length,
                0
            );

            // Verify counts match
            if (destAccountsCount !== this.migrationStats.totalAccounts) {
                throw new Error(`Account count mismatch: Expected ${this.migrationStats.totalAccounts}, got ${destAccountsCount}`);
            }

            if (destHistoryCount !== this.migrationStats.totalHistoryEntries) {
                throw new Error(`History count mismatch: Expected ${this.migrationStats.totalHistoryEntries}, got ${destHistoryCount}`);
            }

            // Verify data integrity (sample check)
            const sampleAccountId = Object.keys(this.backupData.accounts)[0];
            if (sampleAccountId) {
                const sourceAccount = this.backupData.accounts[sampleAccountId];
                const destAccount = destAccounts[sampleAccountId];

                if (JSON.stringify(sourceAccount) !== JSON.stringify(destAccount)) {
                    throw new Error('Data integrity check failed: Sample account data does not match');
                }
            }

            this.log('Migration verification completed successfully.');
            return true;
        } catch (error) {
            this.log(`Verification failed: ${error.message}`, 'error');
            throw error;
        }
    }

    // Main migration orchestrator
    async executeMigration() {
        try {
            this.log('=== FIREBASE DATABASE MIGRATION STARTED ===');

            // Step 1: Read and validate source data
            const sourceData = await this.readSourceData();

            // Step 2: Verify destination is ready
            await this.verifyDestinationEmpty();

            // Step 3: Migrate data
            await this.migrateData(sourceData);

            // Step 4: Verify migration
            await this.verifyMigration();

            this.log('=== MIGRATION COMPLETED SUCCESSFULLY ===');
            this.printSummary();

        } catch (error) {
            this.log(`=== MIGRATION FAILED ===`, 'error');
            this.log(`Error: ${error.message}`, 'error');
            this.printSummary();
            throw error;
        }
    }

    printSummary() {
        console.log('\n=== MIGRATION SUMMARY ===');
        console.log(`Total Accounts: ${this.migrationStats.totalAccounts}`);
        console.log(`Migrated Accounts: ${this.migrationStats.migratedAccounts}`);
        console.log(`Total History Entries: ${this.migrationStats.totalHistoryEntries}`);
        console.log(`Migrated History Entries: ${this.migrationStats.migratedHistoryEntries}`);
        console.log(`Validation Errors: ${this.migrationStats.validationErrors.length}`);
        console.log(`Runtime Errors: ${this.migrationStats.errors.length}`);

        if (this.migrationStats.validationErrors.length > 0) {
            console.log('\nValidation Errors:');
            this.migrationStats.validationErrors.forEach(error => console.log(`- ${error}`));
        }

        if (this.migrationStats.errors.length > 0) {
            console.log('\nRuntime Errors:');
            this.migrationStats.errors.forEach(error => console.log(`- ${error}`));
        }
    }

    // Emergency rollback (only use if something goes wrong)
    async emergencyRollback() {
        this.log('=== EMERGENCY ROLLBACK INITIATED ===', 'error');

        try {
            // Clear destination database
            await destinationDatabase.ref('accounts').remove();
            await destinationDatabase.ref('balanceHistory').remove();

            this.log('Destination database cleared. Migration rolled back.', 'warning');
        } catch (error) {
            this.log(`Rollback failed: ${error.message}`, 'error');
            throw error;
        }
    }
}

// Export for use in migration runner
window.FirebaseMigrationManager = FirebaseMigrationManager;
