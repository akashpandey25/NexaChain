/**
 * Migration Script: Normalize legacy user documents for mobileNumber field
 * and ensure partial unique index on mobileNumber.
 * 
 * Idempotent & Non-destructive:
 * - Only targets documents where mobileNumber does not exist ({ mobileNumber: { $exists: false } }).
 * - Sets mobileNumber to null.
 * - Never overwrites or modifies existing populated mobile numbers.
 * - Synchronizes indexes so partial unique index on { mobileNumber: 1 } is applied.
 */
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');

const migrateMobileNumbers = async () => {
  console.log('🚀 Starting mobileNumber normalization migration...');

  // 1. Count documents with missing mobileNumber
  const missingCount = await User.countDocuments({ mobileNumber: { $exists: false } });
  console.log(`📊 Found ${missingCount} user document(s) with missing mobileNumber field.`);

  let updateResult = { modifiedCount: 0 };
  if (missingCount > 0) {
    updateResult = await User.updateMany(
      { mobileNumber: { $exists: false } },
      { $set: { mobileNumber: null } }
    );
    console.log(`✅ Normalized ${updateResult.modifiedCount} user document(s) with mobileNumber: null.`);
  } else {
    console.log('ℹ️ All existing user documents already have mobileNumber defined.');
  }

  // 2. Synchronize indexes to ensure partial unique index is built
  console.log('🔨 Synchronizing User model indexes...');
  await User.syncIndexes();
  console.log('✅ User indexes synchronized successfully.');

  return {
    documentsChecked: await User.countDocuments(),
    documentsNormalized: updateResult.modifiedCount || 0
  };
};

// Allow standalone execution via `node scripts/migrateMobileNumber.js`
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      const summary = await migrateMobileNumbers();
      console.log('🏁 Migration completed successfully:', summary);
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('❌ Migration failed:', err.message);
      await disconnectDB().catch(() => {});
      process.exit(1);
    }
  })();
}

module.exports = { migrateMobileNumbers };

