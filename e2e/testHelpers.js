const path = require('path');
const mongoose = require(path.resolve(__dirname, '../backend/node_modules/mongoose'));
const bcrypt = require(path.resolve(__dirname, '../backend/node_modules/bcryptjs'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexachain';

let isConnected = false;

async function ensureDbConnected() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
  }
}

async function createTestAdminFixture() {
  await ensureDbConnected();
  const db = mongoose.connection.db;
  const usersColl = db.collection('users');

  const adminEmail = `test-admin-${Date.now()}@nexachain.test`;
  const adminPassword = 'AdminPassword123!';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const referralCode = `ADM${Math.floor(10000 + Math.random() * 90000)}`;

  const adminDoc = {
    name: 'E2E Test Administrator',
    email: adminEmail,
    mobileNumber: `+9199999${Math.floor(10000 + Math.random() * 90000)}`,
    password: hashedPassword,
    role: 'admin',
    referralCode,
    walletBalancePaise: 0,
    totalRoiEarnedPaise: 0,
    totalLevelIncomeEarnedPaise: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const res = await usersColl.insertOne(adminDoc);
  return {
    _id: res.insertedId.toString(),
    email: adminEmail,
    password: adminPassword,
    name: adminDoc.name,
    referralCode
  };
}

async function createTestUserFixture(overrides = {}) {
  await ensureDbConnected();
  const db = mongoose.connection.db;
  const usersColl = db.collection('users');

  const timestamp = Date.now();
  const userEmail = overrides.email || `test-user-${timestamp}-${Math.floor(Math.random() * 1000)}@nexachain.test`;
  const userPassword = overrides.password || 'Password123!';
  const hashedPassword = await bcrypt.hash(userPassword, 10);
  const referralCode = `USR${Math.floor(10000 + Math.random() * 90000)}`;

  const userDoc = {
    name: overrides.name || 'E2E Test User',
    email: userEmail,
    mobileNumber: overrides.mobileNumber || `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: hashedPassword,
    role: 'user',
    referralCode,
    walletBalancePaise: overrides.walletBalancePaise || 0,
    totalRoiEarnedPaise: overrides.totalRoiEarnedPaise || 0,
    totalLevelIncomeEarnedPaise: overrides.totalLevelIncomeEarnedPaise || 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const res = await usersColl.insertOne(userDoc);
  return {
    _id: res.insertedId.toString(),
    email: userEmail,
    password: userPassword,
    name: userDoc.name,
    mobileNumber: userDoc.mobileNumber,
    referralCode
  };
}

async function cleanupTestData() {
  await ensureDbConnected();
  const db = mongoose.connection.db;

  // Find all test users created during e2e testing
  const testUsers = await db.collection('users').find({
    email: { $regex: /@nexachain\.test$/i }
  }).toArray();

  const testUserIds = testUsers.map((u) => u._id);

  if (testUserIds.length > 0) {
    // Delete any test investments created by these users
    await db.collection('investments').deleteMany({
      user: { $in: testUserIds }
    });

    // Delete any ROI or referral records created for these test users
    await db.collection('roi_histories').deleteMany({
      user: { $in: testUserIds }
    });
    await db.collection('roihistories').deleteMany({
      user: { $in: testUserIds }
    });
    await db.collection('referral_incomes').deleteMany({
      $or: [
        { beneficiary: { $in: testUserIds } },
        { sourceUser: { $in: testUserIds } }
      ]
    });
    await db.collection('referralincomes').deleteMany({
      $or: [
        { beneficiary: { $in: testUserIds } },
        { sourceUser: { $in: testUserIds } }
      ]
    });

    // Delete the test users
    await db.collection('users').deleteMany({
      _id: { $in: testUserIds }
    });
  }

  // Also clean up any orphan test investments matching test patterns
  await db.collection('investments').deleteMany({
    rejectionReason: { $regex: /testing/i }
  });
}

async function closeDbConnection() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
    isConnected = false;
  }
}

module.exports = {
  createTestAdminFixture,
  createTestUserFixture,
  cleanupTestData,
  closeDbConnection
};
