# NexaChain – MongoDB Production Readiness & Architecture Guide

## 1. Executive Overview

NexaChain is a financial investment and multi-tier referral management platform. All balance updates, ROI distributions, and referral income allocations must strictly adhere to **ACID** (Atomicity, Consistency, Isolation, Durability) guarantees.

In MongoDB, **multi-document ACID transactions require a Replica Set deployment** (either a self-hosted replica set or a managed cluster such as MongoDB Atlas). Standalone single `mongod` nodes do not support sessions with transactions and will be rejected at runtime by NexaChain's financial services (`supportsTransactions()` check).

---

## 2. Replica Set Requirements

### Why Standalone MongoDB Is Unacceptable
1. **Financial Rollbacks:** When distributing daily ROI across thousands of contracts, any batch failure must atomically roll back the ROI history record, wallet credit, and cumulative investment earnings simultaneously. Without transactions, unhandled network disconnects or process restarts leave partial financial records and broken ledgers.
2. **Distributed Locking:** While atomic operations (`findOneAndUpdate`) work on single collections, multi-collection state coordination relies on replica-set oplogs for deterministic consistency.

### Production Environment: MongoDB Atlas (Recommended)
MongoDB Atlas automatically provisions a 3-node replica set with automated failover, TLS encryption, and daily snapshots.
- **Minimum Tier:** M10 or higher for production workloads (M0/M2/M5 tiers are suitable for staging and dev).
- **Connection URI Format:**
  ```text
  mongodb+srv://<username>:<password>@<cluster>.mongodb.net/nexachain?retryWrites=true&w=majority&appName=NexaChain
  ```

### Local Development / Staging: Single-Node Replica Set
To run transactions locally without a multi-server cluster, initialize a single-node replica set:

1. **Start mongod with `--replSet` flag:**
   ```bash
   mongod --dbpath /data/db --replSet rs0 --bind_ip 127.0.0.1
   ```
2. **Initiate the replica set in `mongosh`:**
   ```javascript
   rs.initiate({
     _id: "rs0",
     members: [{ _id: 0, host: "127.0.0.1:27017" }]
   });
   ```
3. **Verify Replica Set Status:**
   ```javascript
   rs.status();
   ```

---

## 3. Database Connection Configuration & Pooling

NexaChain establishes connection via Mongoose in `backend/src/config/db.js`. For production deployments, configure optimal connection pooling and timeouts:

```javascript
const mongooseOptions = {
  maxPoolSize: 50,              // Maintain up to 50 socket connections
  minPoolSize: 10,              // Keep at least 10 sockets warm
  serverSelectionTimeoutMS: 5000,// Fail fast if cluster unreachable
  socketTimeoutMS: 45000,       // Close sockets after 45s of inactivity
  retryWrites: true,            // Automatically retry transient write failures
  w: 'majority'                 // Await write acknowledgement from quorum
};
```

---

## 4. Required Database Indexes

The application automatically verifies and syncs indexes on startup via Mongoose models. Below is the production index audit:

### `users` Collection
- `{ email: 1 }` — **Unique** (prevents duplicate registrations)
- `{ referralCode: 1 }` — **Unique** (prevents duplicate sponsor codes)
- `{ referredBy: 1 }` — Standard index (accelerates level-1 and tree downline lookups)

### `investments` Collection
- `{ user: 1, status: 1 }` — Compound index (portfolio overview and filtering)
- `{ status: 1, startDate: 1, endDate: 1 }` — Compound index (accelerates daily ROI eligibility batch scans)

### `roi_histories` Collection
- `{ investment: 1, businessDate: 1 }` — **Compound Unique** (guarantees an investment cannot receive duplicate payouts for the same calendar date)
- `{ transactionKey: 1 }` — **Unique** (idempotency key for payout operations)
- `{ user: 1, businessDate: -1 }` — Compound index (fast user earnings ledger retrieval)

### `referral_incomes` Collection
- `{ transactionKey: 1 }` — **Unique** (prevents duplicate commission distributions)
- `{ beneficiary: 1, level: 1 }` — Compound index (tier-level income aggregations)
- `{ sourceInvestment: 1, beneficiary: 1, level: 1 }` — Compound index (audit verification)

### `wallet_transactions` Collection
- `{ transactionKey: 1 }` — **Unique** (prevents double-entry ledger duplication)
- `{ user: 1, createdAt: -1 }` — Compound index (user transaction history lookups)

### `job_locks` Collection
- `{ jobName: 1 }` — **Unique** (guarantees a single lock document per scheduled background job)
- `{ expiresAt: 1 }` — Standard index (fast detection of stale/expired locks)

---

## 5. Backup, Disaster Recovery & Retention

1. **Continuous Backups:**
   - On MongoDB Atlas, enable Continuous Cloud Backups with point-in-time recovery (PITR) allowing restoration to any second within the retention window.
2. **Logical Backups (`mongodump`):**
   - Execute daily automated logical dumps for offsite disaster recovery:
     ```bash
     mongodump --uri="mongodb+srv://..." --archive=backup-$(date +%F).gz --gzip
     ```
3. **Restoration Verification:**
   - Regularly restore dumps to a staging replica set to verify backup integrity:
     ```bash
     mongorestore --uri="mongodb+srv://..." --archive=backup-YYYY-MM-DD.gz --gzip --drop
     ```

---

## 6. Network Security & Credential Management

1. **Network Whitelisting:**
   - Restrict database access strictly to the static IP addresses or VPC peering of your backend application servers (do not allow `0.0.0.0/0` in production).
2. **TLS / SSL Enforcement:**
   - Enforce TLS 1.3 encryption in transit for all connections (`tls=true`).
3. **Database User Least Privilege:**
   - Application user should be granted `readWrite` role scoped only to the `nexachain` database. Do not use admin/root users for the application runtime.
4. **Credential Rotation:**
   - Store `MONGO_URI` securely in environment variable managers (AWS Secrets Manager, GCP Secret Manager, Vault, or hosting platform environment vaults). Never check credentials into source code.
