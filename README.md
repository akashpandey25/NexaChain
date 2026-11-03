# NexaChain – Investment & Referral Management Platform

## 1. Project Overview

**NexaChain** is a professional, scalable, and maintainable full-stack application designed for investment management, multi-tier referral tracking, and automated ROI distribution.

This repository is structured as a monorepo containing decoupled backend and frontend codebases, following clean architecture and modular feature-based design principles.

---

## 2. Technology Stack

### Frontend
- **Runtime & Build Tool:** [Node.js](https://nodejs.org/) & [Vite](https://vitejs.dev/)
- **Core Library:** [React.js](https://react.dev/) (JavaScript)
- **State Management & Data Fetching:** [Redux Toolkit](https://redux-toolkit.js.org/) & [RTK Query](https://redux-toolkit.js.org/rtk-query/overview)
- **Routing:** [React Router DOM](https://reactrouter.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **HTTP Client:** [Axios](https://axios-http.com/) (reserved for custom/fallback network workflows)
- **Data Visualization:** [Recharts](https://recharts.org/)
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Icons:** [Lucide React](https://lucide.dev/)

### Backend
- **Runtime:** [Node.js](https://nodejs.org/) (CommonJS)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database & ODM:** [MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/)
- **Security & Logging:** [Helmet](https://helmetjs.github.io/), [CORS](https://github.com/expressjs/cors), [Morgan](https://github.com/expressjs/morgan)
- **Authentication & Encryption:** [JSON Web Token (JWT)](https://jwt.io/), [Bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Scheduled Tasks:** [Node-Cron](https://github.com/node-cron/node-cron)
- **Validation:** [Zod](https://zod.dev/)
- **Testing & Tooling:** [Jest](https://jestjs.io/), [Supertest](https://github.com/ladjs/supertest), [mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server), [Nodemon](https://nodemon.io/)

---

## 3. Folder Structure

```
nexachain-investment-platform/
│
├── backend/
│   ├── src/
│   │   ├── config/          # Database, environment, and 3rd-party service configs
│   │   ├── models/          # Mongoose data models
│   │   ├── controllers/     # Request handlers and response formatting
│   │   ├── routes/          # API route definitions
│   │   ├── middleware/      # Authentication, authorization, and error handlers
│   │   ├── services/        # Core business logic and calculations
│   │   ├── validators/      # Zod validation schemas
│   │   ├── cron/            # Scheduled jobs (daily ROI, referral settlements)
│   │   ├── utils/           # Helper functions and shared utilities
│   │   ├── tests/           # Integration and unit test suites
│   │   ├── app.js           # Express app setup and middleware configuration
│   │   └── server.js        # Server entry point and HTTP listener
│   │
│   ├── .env.example         # Backend environment variable template
│   ├── .gitignore           # Git ignore rules for backend
│   └── package.json         # Backend dependencies and scripts
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Redux store setup and root RTK Query API slice
│   │   ├── features/        # Feature-based state slices and components
│   │   │   ├── auth/        # User authentication & registration
│   │   │   ├── dashboard/   # User and admin dashboards
│   │   │   ├── investments/ # Investment plan selection & management
│   │   │   ├── roi/         # ROI history and tracking
│   │   │   ├── referrals/   # Referral network tree & commission tracking
│   │   │   ├── wallet/      # Deposit, withdrawal, and balance management
│   │   │   └── ui/          # Shared modal, toast, and theme state
│   │   │
│   │   ├── components/      # Reusable atomic UI components (buttons, cards, inputs)
│   │   ├── pages/           # Page-level components mapped to routes
│   │   ├── layouts/         # Layout wrappers (Sidebar, Navbar, AuthLayout)
│   │   ├── routes/          # Application router configuration and protected routes
│   │   ├── hooks/           # Custom reusable React hooks
│   │   ├── utils/           # Formatting, date helpers, and constants
│   │   ├── assets/          # Static assets (images, icons, fonts)
│   │   ├── App.jsx          # Root component
│   │   ├── main.jsx         # React application mounting point
│   │   └── index.css        # Tailwind CSS imports and global styles
│   │
│   ├── .env.example         # Frontend environment variable template
│   ├── index.html           # HTML template
│   ├── postcss.config.js    # PostCSS configuration for Tailwind CSS
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── vite.config.js       # Vite configuration
│   └── package.json         # Frontend dependencies and scripts
│
├── docs/                    # Architecture diagrams, specifications, and notes
├── postman/                 # Postman API collections and environments
├── .gitignore               # Root git ignore rules
├── README.md                # Project documentation
└── package.json             # Root workspace management scripts
```

---

## 4. Environment Configuration

### Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and update values as needed:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/nexachain
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
CRON_TIMEZONE=Asia/Kolkata
```

### Frontend Configuration (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 5. Installation Instructions

### Prerequisites
- Node.js (v18.x or later recommended; currently tested on v22.x)
- npm (v9.x or later)

### Quick Setup

From the repository root:

```bash
# 1. Install root, backend, and frontend dependencies
npm run install:all

# Alternatively install individually:
npm install
npm install --prefix backend
npm install --prefix frontend
```

---

## 6. Development Commands

### Monorepo Root Commands
```bash
# Run both Backend and Frontend concurrently
npm run dev

# Run only Backend
npm run dev:backend

# Run only Frontend
npm run dev:frontend
```

### Backend Direct Commands (from `backend/`)
```bash
npm run dev    # Starts server with Nodemon on port 5000
npm start      # Starts server in production mode
npm test       # Executes Jest test suite
```

### Frontend Direct Commands (from `frontend/`)
```bash
npm run dev      # Starts Vite dev server on port 5173
npm run build    # Produces production build in dist/
npm run preview  # Previews production build locally
```

---

## 7. Current Implementation Status

| Milestone / Component | Status | Description |
|---|---|---|
| **Project Architecture & Monorepo** | ✅ Completed | Monorepo structure with `frontend/`, `backend/`, `docs/`, and `postman/`. |
| **Dependencies & Environment** | ✅ Completed | Validated Zod environment config with fallback guards. |
| **Database Architecture & Models** | ✅ Completed | Fully indexed Mongoose models (`User`, `Investment`, `ROIHistory`, `ReferralIncome`, `WalletTransaction`, `JobLock`). |
| **Authentication & Authorization** | ✅ Completed | JWT authentication, bcrypt password hashing, input validation, and role-based access control (`user`, `admin`). |
| **Investment Management APIs** | ✅ Completed | Creation, listing, and inspection of investment packages with strict server-side plan rate enforcement. |
| **Dashboard & Analytics APIs** | ✅ Completed | High-performance MongoDB aggregations for portfolio summaries, ROI charts, and referral metrics. |
| **Referral Tree & Network Traversal** | ✅ Completed | Breadth-first batch traversal, cycle protection, depth markers, and paginated direct referral listings. |
| **Daily ROI Processing Engine** | ✅ Completed | Integer paise financial calculations, multi-document atomic transactions, and 3-layer idempotency. |
| **Multi-Level Referral Commissions** | ✅ Completed | Basis-point tier calculations, upline traversal, and atomic multi-tier wallet crediting with rollback guarantees. |
| **Automated Scheduler & Distributed Lock** | ✅ Completed | `node-cron` midnight scheduler (`0 0 * * *` / `Asia/Kolkata`), MongoDB distributed locking, and graceful shutdown with in-flight transaction protection. |
| **Automated Test Suite** | ✅ 100% Passing | **9 Test Suites & 134 Tests passing** across foundation, auth, investments, dashboard, referrals, ROI, commissions, and cron concurrency. |
| **Frontend Architecture & App Shell** | ✅ Completed | Responsive layout with desktop sidebar, mobile navigation drawer, header breadcrumbs, and RTK Query cache invalidation. |
| **Authentication UI** | ✅ Completed | Login and Register pages with React Hook Form, Zod client validation, password reveal toggles, and URL referral code pre-fill. |
| **Dashboard UI** | ✅ Completed | Real-time KPI statistic cards (formatted in INR with Indian numbering), Recharts daily yield area chart, donut portfolio distribution, and recent activity. |
| **Investments Management UI** | ✅ Completed | Portfolio overview cards, status filtering, responsive tables, mobile card lists, pagination, and single investment contract inspection (`/investments/:id`). |
| **Referrals Management UI** | ✅ Completed | Direct referral stats, code & registration URL copy/sharing tools, direct referral lists, interactive collapsible multi-level downline tree visualizer, and income ledger. |
| **ROI History & Analytics UI** | ✅ Completed | Aggregated summary metrics, 30-day daily yield area chart, server-side date range and status filters, responsive transaction ledger, and pagination. |
| **User Profile & Session Governance** | ✅ Completed | Initials avatar, verified account credentials, sponsor linkage, session security disclaimer, read-only audit policy, and RTK Query cache-purging sign out. |
| **Production Concurrency & Security Audit** | ✅ Verified | Comprehensive full-stack audit, graceful shutdown in-flight financial job awaiter, configurable shutdown timeout, and zero committed secrets. |

---

## 8. Authoritative Architectural Documentation

Detailed architectural and operational documentation is available in `backend/docs/`:
- [Database Architecture & Data Design](backend/docs/DATABASE_DESIGN.md)
- [REST API Reference & Endpoint Specifications](backend/docs/API_DOCUMENTATION.md)
- [Daily ROI Processing Engine](backend/docs/ROI_PROCESSING.md)
- [Multi-Level Referral Commission Engine](backend/docs/REFERRAL_COMMISSION_PROCESSING.md)
- [Cron Scheduling & Distributed Lock Architecture](backend/docs/CRON_AND_SCHEDULING.md)

