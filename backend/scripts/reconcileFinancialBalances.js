/**
 * NexaChain Financial Reconciliation Script
 * Audits ledger consistency between User aggregates and granular transaction collections.
 * 
 * Modes:
 *   node backend/scripts/reconcileFinancialBalances.js          (Dry-Run Audit Only)
 *   node backend/scripts/reconcileFinancialBalances.js --apply  (Apply Audited Corrections)
 */
const mongoose = require('mongoose');
const User = require('../src/models/User');
const ROIHistory = require('../src/models/ROIHistory');
const ReferralIncome = require('../src/models/ReferralIncome');
const WalletTransaction = require('../src/models/WalletTransaction');

const reconcileFinancialBalances = async (applyCorrections = false) => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexachain';
  console.log(`[Reconciliation] Connecting to ${mongoUri}... (applyCorrections: ${applyCorrections})`);
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });

  const users = await User.find({});
  const report = [];

  for (const user of users) {
    // 1. Compute true sum from ROIHistory
    const roiAgg = await ROIHistory.aggregate([
      { $match: { user: user._id, status: 'processed' } },
      { $group: { _id: null, total: { $sum: '$amountPaise' } } }
    ]);
    const actualRoiPaise = roiAgg[0]?.total || 0;

    // 2. Compute true sum from ReferralIncome
    const refAgg = await ReferralIncome.aggregate([
      { $match: { beneficiary: user._id, status: 'processed' } },
      { $group: { _id: null, total: { $sum: '$amountPaise' } } }
    ]);
    const actualLevelIncomePaise = refAgg[0]?.total || 0;

    // 3. Count existing wallet transactions
    const walletTxCount = await WalletTransaction.countDocuments({ user: user._id });

    const userRoi = user.totalRoiEarnedPaise || 0;
    const userLevel = user.totalLevelIncomeEarnedPaise || 0;

    const roiDiscrepancy = userRoi - actualRoiPaise;
    const levelDiscrepancy = userLevel - actualLevelIncomePaise;

    const userReport = {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      walletBalancePaise: user.walletBalancePaise,
      persistedRoiPaise: userRoi,
      actualRoiHistoryPaise: actualRoiPaise,
      roiDiscrepancyPaise: roiDiscrepancy,
      persistedLevelIncomePaise: userLevel,
      actualReferralIncomePaise: actualLevelIncomePaise,
      levelDiscrepancyPaise: levelDiscrepancy,
      walletTxCount,
      hasDiscrepancy: roiDiscrepancy !== 0 || levelDiscrepancy !== 0 || (user.walletBalancePaise > 0 && walletTxCount === 0)
    };

    report.push(userReport);
    console.log(`\nUser: ${user.name} (${user.email}) [${user._id}]`);
    console.log(`  Wallet Balance: ₹${(user.walletBalancePaise / 100).toFixed(2)} (${walletTxCount} ledger rows)`);
    console.log(`  ROI Earned: Persisted ₹${(userRoi / 100).toFixed(2)} vs Actual History ₹${(actualRoiPaise / 100).toFixed(2)} (Diff: ₹${(roiDiscrepancy / 100).toFixed(2)})`);
    console.log(`  Level Income: Persisted ₹${(userLevel / 100).toFixed(2)} vs Actual History ₹${(actualLevelIncomePaise / 100).toFixed(2)} (Diff: ₹${(levelDiscrepancy / 100).toFixed(2)})`);

    if (applyCorrections && userReport.hasDiscrepancy) {
      console.log(`  --> Applying controlled reconciliation for ${user.email}...`);

      // 1. Reset unbacked cumulative counters to match actual transaction history
      user.totalRoiEarnedPaise = actualRoiPaise;
      user.totalLevelIncomeEarnedPaise = actualLevelIncomePaise;
      await user.save();
      console.log(`      ✓ Aggregates reconciled: totalRoiEarnedPaise=${actualRoiPaise}, totalLevelIncomeEarnedPaise=${actualLevelIncomePaise}`);

      // 2. If user has an unledgered opening wallet balance, record an auditable opening balance transaction
      if (user.walletBalancePaise > 0 && walletTxCount === 0) {
        const openingTxKey = `opening_balance_${user._id}`;
        const existingTx = await WalletTransaction.findOne({ transactionKey: openingTxKey });
        if (!existingTx) {
          await WalletTransaction.create({
            user: user._id,
            amountPaise: user.walletBalancePaise,
            type: 'credit',
            sourceType: 'adjustment',
            transactionKey: openingTxKey,
            balanceAfterPaise: user.walletBalancePaise,
            description: 'Legacy verified opening test balance'
          });
          console.log(`      ✓ Created audit ledger row for opening balance: ${openingTxKey}`);
        }
      }
    }
  }

  await mongoose.disconnect();
  return report;
};

if (require.main === module) {
  const applyFlag = process.argv.includes('--apply');
  reconcileFinancialBalances(applyFlag)
    .then(() => {
      console.log('\n[Reconciliation] Finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Reconciliation] ❌ Error:', err);
      process.exit(1);
    });
}

module.exports = reconcileFinancialBalances;
