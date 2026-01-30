# Data Migration Guide (Firebase Realtime Database)

This guide helps migrate data safely between Firebase Realtime Database instances without losing data.

## Goals

- Avoid data loss in the destination.
- Preserve existing destination data by default.
- Create backups before any write operations.

## Requirements

- A Firebase service account JSON file
- Node.js installed
- Access to both source and destination Realtime Database URLs

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Export your service account path:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/service-account.json"
   ```

3. Set database URLs:
   ```bash
   export SOURCE_DATABASE_URL="https://source-project-default-rtdb.asia-southeast1.firebasedatabase.app"
   export DEST_DATABASE_URL="https://dest-project-default-rtdb.asia-southeast1.firebasedatabase.app"
   ```

## Dry Run (Recommended First)

```bash
DRY_RUN=true npm run migrate
```

This will:
- Read source and destination data
- Create backups in `backups/`
- Print a summary of planned changes
- **Not** write any data

## Migration (Non-destructive by Default)

```bash
npm run migrate
```

Default conflict policy: **keep destination values**.

## Migrate Only Specific Paths

Use `PATHS` to limit migration to specific branches.

```bash
PATHS="/accounts,/balanceHistory" npm run migrate
```

Notes:
- Use `/` to migrate the full database (default).
- Paths are comma-separated.

## Conflict Policy

Use `CONFLICT=source` to prefer source values on conflicts:

```bash
CONFLICT=source npm run migrate
```

If you want to avoid overwriting existing destination values, keep the default:

```bash
CONFLICT=dest npm run migrate
```

## Backups

Backups are saved in `backups/` with timestamps:
- `source-<timestamp>.json`
- `dest-<timestamp>.json`

## Rollback

If needed, restore a backup by writing it to the destination:

```bash
node tools/migrate.js
```

Set `SOURCE_DATABASE_URL` to the backup's original source and `DEST_DATABASE_URL` to the target you want to restore.

## Notes

- Large datasets may take time to read and write.
- Ensure your Firebase security rules allow admin access.
