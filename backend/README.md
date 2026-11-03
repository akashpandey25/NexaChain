# NexaChain – Backend API & Daily ROI Engine

NexaChain Backend is an enterprise Express.js microservice delivering financial investment APIs, multi-tier referral tree traversal, and automated daily ROI accrual with ACID transaction guarantees.

## Quick Start

```bash
# Install production & development dependencies
npm install

# Run automated test suites (134 tests passing)
npm test

# Start development server with hot reload
npm run dev

# Start production server
npm start
```

## Architecture Documentation

- [REST API Specifications & Contracts](docs/API_DOCUMENTATION.md)
- [Database Models, Schemas & Indexes](docs/DATABASE_DESIGN.md)
- [Daily ROI Transaction Processing Engine](docs/ROI_PROCESSING.md)
- [Multi-Tier Referral Commission Architecture](docs/REFERRAL_COMMISSION_PROCESSING.md)
- [Distributed JobLock & Cron Scheduling](docs/CRON_AND_SCHEDULING.md)

## Production Deployment

- **Port:** Configured via `PORT` (default: 5000)
- **Healthcheck:** `GET /api/health`
- **Docker:** `Dockerfile` provided for multi-stage Node.js Alpine builds
- **Database:** MongoDB Replica Set required for multi-document ACID transactions
