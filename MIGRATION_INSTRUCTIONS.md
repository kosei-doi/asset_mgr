# 🚀 Firebase Database Migration Guide

## Critical Safety Information

**This migration process is designed with maximum safety in mind:**
- ✅ **Source database is NEVER modified** - only read operations
- ✅ **Destination is verified empty** before writing
- ✅ **Data validation** occurs before and after migration
- ✅ **Batch processing** prevents timeout issues
- ✅ **Rollback capability** if something goes wrong
- ❌ **No automatic deletion** of source data

## Prerequisites

### 1. Firebase Projects Setup
You need two Firebase projects:
- **Source Project**: `asset-3a5ef` (your existing database)
- **Destination Project**: `manager-8ac68` (your new database)

Both should have Realtime Database enabled.

### 2. Database Rules
Ensure both databases allow read/write access during migration. You can temporarily use these rules:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

**⚠️ Remember to restore proper security rules after migration!**

### 3. Backup Your Data
Before starting, create backups:

1. **Firebase Console Backup**: Go to your source database → Export JSON
2. **Local Backup**: Download the data as JSON file
3. **Screenshot/Document**: Record your current data structure

## Step-by-Step Migration Process

### Step 1: Prepare Your Environment

1. **Open the migration tool**:
   - Open `migration-runner.html` in your web browser
   - The page will load all necessary scripts automatically

2. **Verify Firebase Configuration**:
   - Check that the console shows: "Migration tool initialized"
   - If you see errors, verify your Firebase config in `js/migration-config.js`

### Step 2: Pre-Migration Safety Checks

1. **Click "🔍 Run Pre-Migration Checks"**
2. **Wait for all checks to complete**. The tool will verify:
   - ✅ Source database connectivity
   - ✅ Destination database is empty
   - ✅ Source data integrity
   - ✅ Data structure validation

3. **Review the results**:
   - If all checks pass: Proceed to Step 3
   - If any checks fail: **STOP** and investigate the issues

### Step 3: Execute the Migration

1. **Click "🚀 Start Migration"**
2. **Confirm the migration** when prompted
3. **Monitor the progress**:
   - Watch the progress bar and log output
   - The process will:
     - Read all source data
     - Validate data structure
     - Migrate accounts in batches
     - Migrate history entries in batches
     - Verify migration success

### Step 4: Post-Migration Verification

1. **Review the migration summary**:
   - Account count should match
   - History entry count should match
   - Verification status should be ✅

2. **Manually verify in Firebase Console**:
   - Check both databases in Firebase Console
   - Compare data structures
   - Verify sample records

### Step 5: Update Your Application

1. **Update your app's Firebase config**:
   ```javascript
   // In firebase-config.js, replace with destination config:
   const firebaseConfig = {
     apiKey: "AIzaSyDhYTiWflm90SZTySJMDlBpGu7WHzkUaL4",
     authDomain: "manager-8ac68.firebaseapp.com",
     databaseURL: "https://manager-8ac68-default-rtdb.asia-southeast1.firebasedatabase.app",
     projectId: "manager-8ac68",
     // ... rest of destination config
   };
   ```

2. **Test your application** with the new database

3. **Restore security rules** on both databases

## Troubleshooting

### Common Issues

#### "Source database connectivity failed"
- Check Firebase config credentials
- Verify the source project exists and Realtime Database is enabled
- Check your internet connection

#### "Destination database is not empty"
- Clear the destination database manually in Firebase Console
- Or use the emergency rollback feature if a previous migration failed

#### "Data validation failed"
- Check the log for specific validation errors
- Your data structure might not match expected format
- Review the `expectedDataStructure` in `migration-config.js`

#### Migration hangs or times out
- Large datasets may take time to process
- Check browser console for errors
- Try refreshing and running checks again

### Emergency Procedures

#### If Migration Fails Midway
1. **Don't panic** - source data is safe
2. **Use Emergency Rollback** if destination has partial data
3. **Restart the migration** from the beginning

#### If You Need to Start Over
1. **Clear destination database** manually in Firebase Console
2. **Refresh the migration tool**
3. **Run pre-checks again**
4. **Start migration**

## Data Structure Expected

Your source database should have this structure:

```
/
├── accounts/
│   └── {accountId}/
│       ├── name: string
│       ├── type: string
│       ├── balance: number
│       ├── currency: string
│       ├── createdAt: string
│       └── updatedAt: string
└── balanceHistory/
    └── {accountId}/
        └── {historyId}/
            ├── amount: number
            ├── type: string ("deposit"|"withdrawal"|"transfer")
            ├── description: string
            ├── timestamp: string
            ├── balanceBefore: number
            └── balanceAfter: number
```

## Security Considerations

### Before Migration
- Temporarily relax database rules for migration
- Ensure migration tool is only accessible to you

### After Migration
1. **Restore proper security rules**:
   ```json
   {
     "rules": {
       "accounts": {
         ".read": "auth != null",
         ".write": "auth != null"
       },
       "balanceHistory": {
         ".read": "auth != null",
         ".write": "auth != null"
       }
     }
   }
   ```

2. **Update client applications** with new database URL

3. **Test authentication** and data access

## Performance Notes

- **Batch Size**: Currently set to 10 accounts per batch
- **Expected Duration**: Depends on data size (minutes to hours)
- **Memory Usage**: Large datasets may require more browser memory
- **Network**: Stable internet connection required

## Support

If you encounter issues:

1. **Check the browser console** for detailed error messages
2. **Review the migration log** for specific error details
3. **Verify your Firebase project settings**
4. **Ensure database rules allow read/write during migration**

## Files Created for Migration

- `migration-runner.html` - Main migration interface
- `js/migration-config.js` - Database configurations
- `js/migration-script.js` - Core migration logic
- `js/migration-verification.js` - Safety checks and verification
- `MIGRATION_INSTRUCTIONS.md` - This guide

---

**Remember: Take your time with each step. Better to be safe than lose data!** 🛡️
