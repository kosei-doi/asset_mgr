// MIGRATION VERIFICATION UTILITIES
// Additional safety checks and data integrity verification

class MigrationVerifier {
    constructor(sourceDatabase, destinationDatabase) {
        this.sourceDb = sourceDatabase;
        this.destDb = destinationDatabase;
    }

    // Comprehensive pre-migration checks
    async performPreMigrationChecks() {
        console.log('🔍 Performing pre-migration safety checks...');

        const checks = {
            sourceConnectivity: false,
            destinationConnectivity: false,
            sourceDataIntegrity: false,
            destinationEmpty: false,
            dataStructureValid: false
        };

        try {
            // Check source connectivity
            await this.sourceDb.ref('.info/connected').once('value');
            checks.sourceConnectivity = true;
            console.log('✅ Source database connectivity: OK');

            // Check destination connectivity
            await this.destDb.ref('.info/connected').once('value');
            checks.destinationConnectivity = true;
            console.log('✅ Destination database connectivity: OK');

            // Check source data integrity
            const sourceData = await this.readSourceDataSummary();
            checks.sourceDataIntegrity = sourceData.isValid;
            if (checks.sourceDataIntegrity) {
                console.log(`✅ Source data integrity: OK (${sourceData.accountCount} accounts, ${sourceData.historyCount} history entries)`);
            } else {
                console.log('❌ Source data integrity: FAILED');
                console.log('Issues:', sourceData.issues);
            }

            // Check destination is empty
            const destData = await this.checkDestinationEmpty();
            checks.destinationEmpty = destData.isEmpty;
            if (checks.destinationEmpty) {
                console.log('✅ Destination database: EMPTY (safe to migrate)');
            } else {
                console.log(`❌ Destination database: NOT EMPTY (${destData.accountCount} accounts, ${destData.historyCount} history entries)`);
            }

            // Validate data structure
            if (checks.sourceDataIntegrity) {
                checks.dataStructureValid = await this.validateDataStructure();
                console.log(checks.dataStructureValid ? '✅ Data structure validation: PASSED' : '❌ Data structure validation: FAILED');
            }

            const allChecksPass = Object.values(checks).every(check => check);
            console.log(allChecksPass ? '\n🎉 All pre-migration checks PASSED!' : '\n⚠️  Some checks FAILED - review before proceeding');

            return { checks, allChecksPass, sourceData };

        } catch (error) {
            console.error('❌ Pre-migration checks failed:', error.message);
            throw error;
        }
    }

    async readSourceDataSummary() {
        try {
            const [accountsSnap, historySnap] = await Promise.all([
                this.sourceDb.ref('accounts').once('value'),
                this.sourceDb.ref('balanceHistory').once('value')
            ]);

            const accounts = accountsSnap.val() || {};
            const history = historySnap.val() || {};

            const accountCount = Object.keys(accounts).length;
            const historyCount = Object.values(history).reduce(
                (total, accountHistory) => total + Object.keys(accountHistory || {}).length, 0
            );

            // Basic integrity checks
            const issues = [];
            let isValid = true;

            // Check for accounts without required fields
            for (const [accountId, account] of Object.entries(accounts)) {
                if (!account.name || !account.balance || typeof account.balance !== 'number') {
                    issues.push(`Account ${accountId}: Missing or invalid required fields`);
                    isValid = false;
                }
            }

            return { accountCount, historyCount, isValid, issues };

        } catch (error) {
            return { accountCount: 0, historyCount: 0, isValid: false, issues: [error.message] };
        }
    }

    async checkDestinationEmpty() {
        try {
            const [accountsSnap, historySnap] = await Promise.all([
                this.destDb.ref('accounts').once('value'),
                this.destDb.ref('balanceHistory').once('value')
            ]);

            const accounts = accountsSnap.val() || {};
            const history = historySnap.val() || {};

            const accountCount = Object.keys(accounts).length;
            const historyCount = Object.values(history).reduce(
                (total, accountHistory) => total + Object.keys(accountHistory || {}).length, 0
            );

            return {
                isEmpty: accountCount === 0 && historyCount === 0,
                accountCount,
                historyCount
            };

        } catch (error) {
            throw new Error(`Failed to check destination: ${error.message}`);
        }
    }

    async validateDataStructure() {
        try {
            const [accountsSnap, historySnap] = await Promise.all([
                this.sourceDb.ref('accounts').once('value'),
                this.sourceDb.ref('balanceHistory').once('value')
            ]);

            const accounts = accountsSnap.val() || {};
            const history = historySnap.val() || {};

            // Expected structure validation
            const expectedAccountFields = ['name', 'type', 'balance', 'currency', 'createdAt', 'updatedAt'];
            const expectedHistoryFields = ['amount', 'type', 'description', 'timestamp', 'balanceBefore', 'balanceAfter'];

            for (const [accountId, account] of Object.entries(accounts)) {
                for (const field of expectedAccountFields) {
                    if (!(field in account)) {
                        console.log(`⚠️  Account ${accountId} missing field: ${field}`);
                        return false;
                    }
                }
            }

            for (const [accountId, accountHistory] of Object.entries(history)) {
                for (const [historyId, entry] of Object.entries(accountHistory)) {
                    for (const field of expectedHistoryFields) {
                        if (!(field in entry)) {
                            console.log(`⚠️  History ${accountId}/${historyId} missing field: ${field}`);
                            return false;
                        }
                    }
                }
            }

            return true;

        } catch (error) {
            console.error('Data structure validation failed:', error.message);
            return false;
        }
    }

    // Post-migration verification
    async performPostMigrationVerification() {
        console.log('🔍 Performing post-migration verification...');

        try {
            const [sourceAccounts, sourceHistory, destAccounts, destHistory] = await Promise.all([
                this.sourceDb.ref('accounts').once('value'),
                this.sourceDb.ref('balanceHistory').once('value'),
                this.destDb.ref('accounts').once('value'),
                this.destDb.ref('balanceHistory').once('value')
            ]);

            const source = {
                accounts: sourceAccounts.val() || {},
                history: sourceHistory.val() || {}
            };

            const dest = {
                accounts: destAccounts.val() || {},
                history: destHistory.val() || {}
            };

            // Count verification
            const sourceCounts = this.getDataCounts(source);
            const destCounts = this.getDataCounts(dest);

            if (sourceCounts.accounts !== destCounts.accounts) {
                throw new Error(`Account count mismatch: ${sourceCounts.accounts} vs ${destCounts.accounts}`);
            }

            if (sourceCounts.history !== destCounts.history) {
                throw new Error(`History count mismatch: ${sourceCounts.history} vs ${destCounts.history}`);
            }

            // Data integrity verification (sample)
            const sampleVerification = await this.verifyDataIntegrity(source, dest);
            if (!sampleVerification.passed) {
                throw new Error(`Data integrity check failed: ${sampleVerification.details}`);
            }

            console.log('✅ Post-migration verification: PASSED');
            console.log(`   Accounts: ${destCounts.accounts}, History entries: ${destCounts.history}`);

            return { sourceCounts, destCounts, verificationPassed: true };

        } catch (error) {
            console.error('❌ Post-migration verification: FAILED');
            throw error;
        }
    }

    getDataCounts(data) {
        return {
            accounts: Object.keys(data.accounts).length,
            history: Object.values(data.history).reduce(
                (total, accountHistory) => total + Object.keys(accountHistory || {}).length, 0
            )
        };
    }

    async verifyDataIntegrity(source, dest) {
        try {
            // Pick first account for sample verification
            const accountIds = Object.keys(source.accounts);
            if (accountIds.length === 0) {
                return { passed: true, details: 'No accounts to verify' };
            }

            const sampleAccountId = accountIds[0];
            const sourceAccount = source.accounts[sampleAccountId];
            const destAccount = dest.accounts[sampleAccountId];

            if (!destAccount) {
                return { passed: false, details: `Account ${sampleAccountId} not found in destination` };
            }

            // Compare account data
            if (JSON.stringify(sourceAccount) !== JSON.stringify(destAccount)) {
                return { passed: false, details: `Account ${sampleAccountId} data mismatch` };
            }

            // Compare history data for this account
            const sourceHistory = source.history[sampleAccountId] || {};
            const destHistory = dest.history[sampleAccountId] || {};

            const sourceHistoryIds = Object.keys(sourceHistory).sort();
            const destHistoryIds = Object.keys(destHistory).sort();

            if (sourceHistoryIds.length !== destHistoryIds.length) {
                return { passed: false, details: `History count mismatch for account ${sampleAccountId}` };
            }

            for (const historyId of sourceHistoryIds) {
                if (JSON.stringify(sourceHistory[historyId]) !== JSON.stringify(destHistory[historyId])) {
                    return { passed: false, details: `History entry ${historyId} mismatch for account ${sampleAccountId}` };
                }
            }

            return { passed: true, details: 'Sample verification passed' };

        } catch (error) {
            return { passed: false, details: error.message };
        }
    }

    // Generate migration report
    generateMigrationReport(preCheckResults, postCheckResults, migrationStats) {
        const report = {
            timestamp: new Date().toISOString(),
            preMigrationChecks: preCheckResults,
            postMigrationVerification: postCheckResults,
            migrationStats: migrationStats,
            success: postCheckResults?.verificationPassed || false
        };

        console.log('\n📊 MIGRATION REPORT');
        console.log('==================');
        console.log(`Timestamp: ${report.timestamp}`);
        console.log(`Status: ${report.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`Accounts migrated: ${report.migrationStats?.migratedAccounts || 0}`);
        console.log(`History entries migrated: ${report.migrationStats?.migratedHistoryEntries || 0}`);

        return report;
    }
}

// Export for use
window.MigrationVerifier = MigrationVerifier;
