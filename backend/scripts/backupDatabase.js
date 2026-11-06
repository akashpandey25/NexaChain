/**
 * NexaChain Database Safe Backup Utility
 * Dumps all collections in JSON format with timestamps before applying any data corrections.
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const backupDatabase = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexachain';
  console.log(`[Backup] Connecting to ${mongoUri}...`);
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });

  const backupDir = path.resolve(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `nexachain_backup_${timestamp}.json`);

  const collections = await mongoose.connection.db.listCollections().toArray();
  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      database: mongoose.connection.db.databaseName,
      totalCollections: collections.length
    },
    collections: {}
  };

  for (const c of collections) {
    const docs = await mongoose.connection.db.collection(c.name).find({}).toArray();
    backupData.collections[c.name] = docs;
    console.log(`[Backup] Exported ${docs.length} documents from "${c.name}"`);
  }

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`[Backup] ✅ Full database backup created successfully: ${backupFile}`);

  await mongoose.disconnect();
  return backupFile;
};

if (require.main === module) {
  backupDatabase()
    .then((file) => {
      console.log(`[Backup] Finished: ${file}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Backup] ❌ Backup failed:', err);
      process.exit(1);
    });
}

module.exports = backupDatabase;
