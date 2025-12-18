# 🔄 JSON-Based Firebase Database Migration Guide

## Overview

You have provided JSON export files from both your Firebase databases. This approach is **significantly safer** than live database migration because:

- ✅ **No risk** to your live databases
- ✅ **Complete data visibility** before migration
- ✅ **Easy rollback** if needed
- ✅ **Offline processing** - no network dependency

## 📁 Your JSON Files

Based on your workspace, you have:

1. **`asset-3a5ef-default-rtdb-export (1).json`** (203 lines)
   - Source database export
   - Contains: `accounts/` and `balanceHistory/`

2. **`manager-8ac68-default-rtdb-export.json`** (4,194 lines)
   - Destination database export
   - Contains: `assets/{userId}/accounts/` and `assets/{userId}/balanceHistory/`
   - **Already contains migrated data!**

## 🔍 Data Structure Analysis

### Source Database Structure
```json
{
  "accounts": {
    "acc_1765171173986_gx3pec80b": {
      "accountId": "acc_1765171173986_gx3pec80b",
      "accountName": "１８親和銀行",
      "accountType": "Savings",
      "createdAt": "2025-12-08T05:19:33.986Z",
      "latestBalance": 175995
    }
  },
  "balanceHistory": {
    "acc_1765171173986_gx3pec80b": {
      "hist_1765171407859_pgnpvl9jk": {
        "accountId": "acc_1765171173986_gx3pec80b",
        "balance": 108092,
        "historyId": "hist_1765171407859_pgnpvl9jk",
        "inputDate": "2025-12-07T15:00:00.000Z",
        "memo": ""
      }
    }
  }
}
```

### Destination Database Structure
```json
{
  "assets": {
    "user_mj6osxju_ghkdmci": {
      "accounts": { /* same structure as source */ },
      "balanceHistory": { /* same structure as source */ }
    }
  }
}
```

## 🚀 Migration Workflow

### Step 1: Open the Migration Tool

```bash
# Open the JSON migration tool
open json-migration-runner.html
```

### Step 2: Load and Analyze Files

1. Click **"🔍 Load & Analyze Files"**
2. The tool will:
   - ✅ Load source JSON export
   - ✅ Load destination JSON export
   - ✅ Analyze data structures
   - ✅ Count records in each database

### Step 3: Compare Data

1. Click **"📊 Compare Data"**
2. The tool will show:
   - **New accounts** to migrate
   - **Account updates** needed
   - **New history entries** to migrate
   - **History updates** needed
   - **Matching records** (already synchronized)

### Step 4: Generate Export File

1. Click **"📤 Generate Export"**
2. If changes are needed, confirm the migration
3. The tool generates: `firebase-import-YYYY-MM-DD.json`
4. This file contains the complete destination database with your migrated data

### Step 5: Import to Firebase

1. **Open Firebase Console** → Go to your destination project
2. **Navigate** to Realtime Database
3. **Click the ⋮ menu** → **Import JSON**
4. **Select** the generated `firebase-import-YYYY-MM-DD.json` file
5. **Confirm import**

## 📊 Understanding the Results

### Possible Scenarios

#### Scenario 1: Data Already Migrated
- **Comparison shows**: 0 changes needed
- **Result**: All data is already synchronized
- **Action**: No migration needed

#### Scenario 2: Partial Migration
- **Comparison shows**: Some accounts/history missing
- **Result**: Export file will include missing data
- **Action**: Import the generated file

#### Scenario 3: Data Conflicts
- **Comparison shows**: Some records need updates
- **Result**: Export file will overwrite conflicting data
- **Action**: Review changes, then import

## 🔧 Technical Details

### Data Transformation

The migration tool handles structural differences:

```javascript
// Source format → Destination format
{
  accounts: { /* data */ },           // Source: flat structure
  balanceHistory: { /* data */ }
}

// Becomes:
{
  assets: {
    user_xxx: {                      // Destination: nested under user
      accounts: { /* data */ },
      balanceHistory: { /* data */ }
    }
  }
}
```

### Validation Checks

The tool validates:
- ✅ **Required fields** present in all records
- ✅ **Data types** correct (numbers for balances)
- ✅ **Structural integrity** maintained
- ✅ **Account-history relationships** preserved

### Safety Features

- 🛡️ **Read-only operations** on your JSON files
- 🛡️ **No live database access** required
- 🛡️ **Complete data backup** before changes
- 🛡️ **Detailed change log** for transparency
- 🛡️ **Export preview** before Firebase import

## 🔄 Import Process

### Firebase Console Import Steps

1. **Login** to Firebase Console
2. **Select** your destination project (`manager-8ac68`)
3. **Go to** Realtime Database
4. **Click** the **⋮** (three dots) menu
5. **Choose** "Import JSON"
6. **Select** your generated file
7. **Click** "Import"

### Import Considerations

- ⚠️ **Import will overwrite** existing data
- ⚠️ **Backup first** if you have additional data in destination
- ⚠️ **Test import** in a development environment first
- ⚠️ **Verify results** after import

## 🐛 Troubleshooting

### "Files not found" error
- Ensure JSON files are in the same directory as the HTML file
- Check filenames match exactly (including spaces and numbers)

### "Data structure invalid" error
- Your JSON exports might be corrupted
- Re-export from Firebase Console

### "No changes needed" but data is missing
- Check if you're looking at the right database in Firebase Console
- Verify the user ID in the destination structure

### Import fails in Firebase Console
- Check file size (Firebase has limits)
- Try importing in smaller batches
- Verify JSON syntax with a validator

## 📋 File Checklist

Before starting migration:

- ✅ `json-migration-runner.html` - Migration interface
- ✅ `js/json-migration-manager.js` - Migration logic
- ✅ `asset-3a5ef-default-rtdb-export (1).json` - Source data
- ✅ `manager-8ac68-default-rtdb-export.json` - Destination data

## 🎯 Success Criteria

After migration, verify:

1. **All accounts** present in destination database
2. **All balance history** entries migrated
3. **Data integrity** maintained (balances, dates, etc.)
4. **Application works** with new database
5. **No data loss** from source database

## 📞 Support

If you encounter issues:

1. **Check browser console** for detailed error messages
2. **Review the migration log** for specific errors
3. **Validate JSON files** with an online JSON validator
4. **Test with sample data** first

## 🔐 Security Notes

- JSON exports may contain sensitive data
- Store export files securely
- Delete temporary files after migration
- Update Firebase security rules after import

---

**🎉 Your JSON-based approach is the safest way to migrate Firebase data!**
