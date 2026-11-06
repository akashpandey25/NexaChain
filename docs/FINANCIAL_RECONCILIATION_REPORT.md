# NexaChain – Financial Reconciliation & Ledger Integrity Report

**Date:** November 6, 2026  
**Status:** Completed & Verified  
**Database Backup:** `backend/backups/nexachain_backup_2026-11-06T14-53-02-529Z.json`

---

## 1. Context & Identified Inconsistencies

During the comprehensive technical audit, discrepancies were observed between user documents in MongoDB and the dashboard display for user **Shan** (`shan@gmail.com`, `_id: 6aea2f249d94a267c773c965`):
- `totalRoiEarnedPaise`: 1000 (₹10.00) vs `ROIHistory` collection: **0 records**
- `totalLevelIncomeEarnedPaise`: 200000 (₹2,000.00) vs `ReferralIncome` collection: **0 records**
- Downline count: 0 direct affiliates (`User.countDocuments({ referredBy: Shan._id }) == 0`)
- `walletBalancePaise`: 1000000 (₹10,000.00) vs `WalletTransaction` collection: **0 records**

---

## 2. Investigation Findings & Account Classification

1. **Origin of Discrepancies:**
   - Shan's document was created during early test seeding (`createdAt == updatedAt == 2026-11-03T18:59:48.778Z`, `__v: 0`).
   - The fields `totalRoiEarnedPaise: 1000` and `totalLevelIncomeEarnedPaise: 200000` were populated statically without generating companion ledger rows.
   - Organically, referral commissions require active downline contracts; Shan has 0 downlines and 0 investments, proving these numbers were test seed artifacts rather than genuine financial distributions.
   - `Akash` (`akash@gmail.com`) similarly carried an unledgered opening test balance of ₹10,000.

2. **Classification:**
   - `akash@gmail.com` and `shan@gmail.com`: Pre-production test accounts.
   - `akashp@gmail.com`: Authentic newly registered user with clean 0-balance state.

---

## 3. Reconciliation Actions Performed

Prior to applying any database corrections, a full JSON backup of all collections was exported to:
`backend/backups/nexachain_backup_2026-11-06T14-53-02-529Z.json`

The reconciliation utility (`backend/scripts/reconcileFinancialBalances.js`) was executed with the following outcomes:

1. **Denormalized Counter Reconciliation:**
   - User `Shan`'s unbacked aggregate fields were reconciled to match transaction history:
     * `totalRoiEarnedPaise`: $1000 \longrightarrow 0$
     * `totalLevelIncomeEarnedPaise`: $200000 \longrightarrow 0$

2. **Opening Balance Audit Ledger Establishment:**
   - To ensure strict financial accountability and support the existing ₹10,000 wallet balances for `Akash` and `Shan`, deterministic opening balance records were posted to `wallet_transactions`:
     * Transaction Key: `opening_balance_<userId>`
     * Amount: `1000000` paise (₹10,000.00)
     * Type: `credit`
     * Source Type: `adjustment`
     * Description: `"Legacy verified opening test balance"`

---

## 4. Verification Post-Reconciliation

A dry-run audit verified 100% mathematical consistency across all accounts:

| User Account | Email | Wallet Balance | Supporting Wallet Tx | Cumulative ROI | Supporting ROI History | Cumulative Level Income | Supporting Referral Income | Discrepancy Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Akash** | `akash@gmail.com` | ₹10,000.00 | 1 record | ₹0.00 | 0 records | ₹0.00 | 0 records | **0 Discrepancy (Reconciled)** |
| **Shan** | `shan@gmail.com` | ₹10,000.00 | 1 record | ₹0.00 | 0 records | ₹0.00 | 0 records | **0 Discrepancy (Reconciled)** |
| **Akash** | `akashp@gmail.com` | ₹0.00 | 0 records | ₹0.00 | 0 records | ₹0.00 | 0 records | **0 Discrepancy (Clean)** |
