const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const SOURCE_DATABASE_URL = process.env.SOURCE_DATABASE_URL;
const DEST_DATABASE_URL = process.env.DEST_DATABASE_URL;
const DRY_RUN = process.env.DRY_RUN === 'true';
const CONFLICT = (process.env.CONFLICT || 'dest').toLowerCase(); // dest | source
const PATHS = (process.env.PATHS || '/').split(',').map((p) => p.trim()).filter(Boolean);
const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!SOURCE_DATABASE_URL || !DEST_DATABASE_URL || !SERVICE_ACCOUNT_PATH) {
  console.error('Missing required environment variables.');
  console.error('Required: SOURCE_DATABASE_URL, DEST_DATABASE_URL, GOOGLE_APPLICATION_CREDENTIALS');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

const sourceApp = admin.initializeApp(
  {
    credential: admin.credential.cert(serviceAccount),
    databaseURL: SOURCE_DATABASE_URL
  },
  'source'
);

const destApp = admin.initializeApp(
  {
    credential: admin.credential.cert(serviceAccount),
    databaseURL: DEST_DATABASE_URL
  },
  'dest'
);

const sourceDb = sourceApp.database();
const destDb = destApp.database();

const backupsDir = path.join(process.cwd(), 'backups');

function ensureBackupsDir() {
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
}

function writeBackup(filename, data) {
  ensureBackupsDir();
  const filepath = path.join(backupsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  return filepath;
}

function isPlainObject(val) {
  return !!val && typeof val === 'object' && !Array.isArray(val);
}

function mergeData(src, dest, conflict = 'dest') {
  if (src === undefined) return dest;
  if (dest === undefined) return src;
  if (src === null || dest === null) {
    return conflict === 'source' ? src : dest;
  }
  if (Array.isArray(src) || Array.isArray(dest)) {
    return conflict === 'source' ? src : dest;
  }
  if (isPlainObject(src) && isPlainObject(dest)) {
    const out = { ...dest };
    for (const key of Object.keys(src)) {
      if (Object.prototype.hasOwnProperty.call(dest, key)) {
        out[key] = mergeData(src[key], dest[key], conflict);
      } else {
        out[key] = src[key];
      }
    }
    return out;
  }
  return conflict === 'source' ? src : dest;
}

function diffStats(src, dest, merged) {
  let added = 0;
  let overwritten = 0;
  let unchanged = 0;

  function walk(s, d, m) {
    if (isPlainObject(m)) {
      const keys = new Set([
        ...Object.keys(s || {}),
        ...Object.keys(d || {}),
        ...Object.keys(m || {})
      ]);
      keys.forEach((k) => walk(s ? s[k] : undefined, d ? d[k] : undefined, m ? m[k] : undefined));
      return;
    }
    if (d === undefined && m !== undefined) {
      added += 1;
    } else if (d !== undefined && m !== undefined) {
      const dStr = JSON.stringify(d);
      const mStr = JSON.stringify(m);
      if (dStr === mStr) {
        unchanged += 1;
      } else {
        overwritten += 1;
      }
    }
  }

  walk(src, dest, merged);
  return { added, overwritten, unchanged };
}

async function main() {
  console.log('Fetching source data...');
  const sourceSnap = await sourceDb.ref('/').once('value');
  const sourceData = sourceSnap.val() || {};

  console.log('Fetching destination data...');
  const destSnap = await destDb.ref('/').once('value');
  const destData = destSnap.val() || {};

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sourceBackup = writeBackup(`source-${timestamp}.json`, sourceData);
  const destBackup = writeBackup(`dest-${timestamp}.json`, destData);
  console.log(`Backup saved: ${sourceBackup}`);
  console.log(`Backup saved: ${destBackup}`);

  console.log(`Merging with conflict policy: ${CONFLICT}`);
  console.log(`Paths: ${PATHS.join(', ')}`);
  const merged = { ...destData };
  let totalStats = { added: 0, overwritten: 0, unchanged: 0 };

  for (const p of PATHS) {
    const pathKey = p === '/' ? '/' : p.replace(/^\/+|\/+$/g, '');
    const srcBranch = p === '/' ? sourceData : (sourceData ? sourceData[pathKey] : undefined);
    const destBranch = p === '/' ? destData : (destData ? destData[pathKey] : undefined);
    const mergedBranch = mergeData(srcBranch, destBranch, CONFLICT);

    if (p === '/') {
      Object.assign(merged, mergedBranch || {});
    } else {
      merged[pathKey] = mergedBranch;
    }

    const stats = diffStats(srcBranch || {}, destBranch || {}, mergedBranch || {});
    totalStats.added += stats.added;
    totalStats.overwritten += stats.overwritten;
    totalStats.unchanged += stats.unchanged;
    console.log(`[${p}] added=${stats.added}, overwritten=${stats.overwritten}, unchanged=${stats.unchanged}`);
  }

  console.log(`Planned changes (total): added=${totalStats.added}, overwritten=${totalStats.overwritten}, unchanged=${totalStats.unchanged}`);

  if (DRY_RUN) {
    console.log('DRY_RUN=true, no data written.');
    return;
  }

  console.log('Writing merged data to destination...');
  await destDb.ref('/').set(merged);
  console.log('Migration completed.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
