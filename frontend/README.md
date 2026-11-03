# NexaChain Frontend Documentation

## 1. Overview

The NexaChain frontend is built with React 18, Vite 6, Tailwind CSS 3, and Redux Toolkit with RTK Query and Recharts. It provides a responsive financial dashboard interface with a clean fintech aesthetic, featuring neutral dark surfaces (`slate-950`/`slate-900`) and restrained emerald accents (`emerald-500`/`emerald-600`).

---

## 2. Directory Architecture

```
frontend/src/
├── app/
│   ├── api/
│   │   └── baseApi.js            # Central RTK Query API with token injection & error normalization
│   ├── router.jsx                # React Router DOM configuration with route guards & lazy routes
│   └── store.js                  # Central Redux store with custom hooks
├── features/
│   ├── auth/
│   │   ├── authSlice.js          # Authentication state and credential management
│   │   └── authApi.js            # Endpoints: /auth/register, /auth/login, /auth/me
│   ├── dashboard/
│   │   ├── dashboardApi.js       # Endpoints: /dashboard with cache tags and transformed response
│   │   └── components/
│   │       ├── StatCard.jsx                   # Reusable financial KPI card
│   │       ├── RoiHistoryChart.jsx            # Recharts AreaChart for daily ROI history
│   │       ├── InvestmentDistributionChart.jsx# Recharts Donut PieChart for status allocation
│   │       ├── RecentActivitySection.jsx      # Activity tabs for ROI payouts & investments
│   │       └── DashboardSkeleton.jsx          # Pulse skeleton for loading states
│   ├── investments/
│   │   ├── investmentApi.js      # Endpoints: /investments (create, list, getById)
│   │   └── components/
│   │       ├── InvestmentsOverview.jsx        # Portfolio KPI summary cards & status breakdown
│   │       ├── InvestmentsFilterBar.jsx       # Status filter tabs, page-size dropdown & reset
│   │       ├── InvestmentsTable.jsx           # Responsive desktop table with copyable IDs & actions
│   │       ├── InvestmentsCardList.jsx        # Mobile touch-friendly card list view
│   │       ├── InvestmentsPagination.jsx      # Server-driven accessible pagination bar
│   │       ├── InvestmentsSkeleton.jsx        # Loading skeleton for listing views
│   │       └── InvestmentDetailSkeleton.jsx   # Loading skeleton for /investments/:id
│   ├── referrals/
│   │   ├── referralApi.js        # Endpoints: /referrals/direct, /referrals/tree, /referrals/income
│   │   └── components/
│   │       ├── ReferralOverview.jsx           # High-level affiliate KPI summary cards
│   │       ├── ReferralCodeShareCard.jsx      # Referral code display, link generator & copy actions
│   │       ├── DirectReferralsList.jsx        # Level 1 downlines table, cards & pagination
│   │       ├── ReferralTreeView.jsx           # Multi-tier recursive tree view with cycle safety & depth controls
│   │       └── ReferralIncomeHistory.jsx      # Audited commission disbursement log with status filters
│   ├── roi/
│   │   ├── roiApi.js             # Endpoints: /roi/history, /roi/summary
│   │   └── components/
│   │       ├── RoiOverviewCards.jsx           # Payout KPI cards & latest distribution summary
│   │       ├── RoiAnalyticsChart.jsx          # Daily yield AreaChart with custom INR tooltip
│   │       ├── RoiFilterBar.jsx               # Status & date range filters with page-size selector
│   │       ├── RoiHistoryTable.jsx            # Desktop transaction history table
│   │       ├── RoiHistoryCardList.jsx         # Mobile touch-friendly card list view
│   │       ├── RoiPagination.jsx              # Server-driven accessible pagination bar
│   │       └── RoiSkeleton.jsx                # Pulse loading skeleton for analytics & table
│   └── wallet/
│       └── walletApi.js          # Reusable wallet overview query hooks
├── components/
│   ├── common/
│   │   ├── AppButton.jsx         # Styled button with variants, sizes, and loading state
│   │   ├── FormField.jsx         # Accessible form wrapper with label, error, and hint
│   │   ├── PageHeader.jsx        # Standardized page title, subtitle, and action button container
│   │   ├── ProtectedRoute.jsx    # Authentication route guard with redirection and initialization check
│   │   └── PublicRoute.jsx       # Public-only route guard (redirects authenticated users to /dashboard)
│   └── feedback/
│       ├── EmptyState.jsx        # Empty collection illustration, description, and action button
│       ├── ErrorMessage.jsx      # Alert banner rendering backend error messages and validation lists
│       └── LoadingSpinner.jsx    # Indeterminate loading spinner with customizable text
├── layouts/
│   ├── AppLayout.jsx             # Authenticated shell: desktop sidebar, mobile drawer, top navigation
│   └── AuthLayout.jsx            # Unauthenticated shell: centered dark-card auth container
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx         # Email/password login with show/hide control and client validation
│   │   └── RegisterPage.jsx      # Registration form with ?ref=CODE auto-population and password validation
│   ├── dashboard/
│   │   └── DashboardPage.jsx     # Full data-driven dashboard integrating all metrics & Recharts
│   ├── investments/
│   │   ├── InvestmentsPage.jsx   # Investments portfolio: KPI overview, filters, table, cards & pagination
│   │   └── InvestmentDetailPage.jsx # Dedicated /investments/:id contract inspector & lifecycle breakdown
│   ├── referrals/
│   │   └── ReferralsPage.jsx     # Referral hub: overview, share cards, direct downlines, tree & income log
│   ├── roi/
│   │   └── RoiHistoryPage.jsx    # Daily automated ROI distribution ledger and summary metrics
│   ├── profile/
│   │   └── ProfilePage.jsx       # Account credentials, referral code, and role status
│   └── NotFoundPage.jsx          # 404 handler with redirection back to /dashboard
├── utils/
│   ├── formatters.js             # Currency (paise -> INR), dates, and status styling utilities
│   └── tokenStorage.js           # Safe token getter/setter with documented security trade-offs
├── App.jsx                       # Root app component handling session hydration and RouterProvider
├── main.jsx                      # React DOM root entry wrapping <Provider store={store}>
└── index.css                     # Tailwind CSS entry directives
```

---

## 3. Investments Management Feature (`InvestmentsPage.jsx` & `InvestmentDetailPage.jsx`)

The Investments section is built directly on the server-authoritative contracts and pagination APIs.

### A. Endpoints Used
1. `GET /api/investments`:
   - Query Parameters: `page` (integer >= 1), `limit` (10, 20, 50), and optional `status` (`pending`, `active`, `completed`, `cancelled`).
   - Scoped strictly to the authenticated user ID (`req.user._id`).
   - Returns paginated investment documents with pagination metadata (`currentPage`, `pageSize`, `totalRecords`, `totalPages`, `hasNextPage`, `hasPrevPage`).
2. `GET /api/investments/:id`:
   - Query Parameter: MongoDB 24-character hexadecimal ObjectId.
   - Enforces ownership: returns `404 Not Found` if the contract ID belongs to another user.
3. `GET /api/dashboard`:
   - Supplies the aggregated overview metrics (`totalCount`, `activeCount`, `totalInvestmentPaise`, `activeInvestmentPaise`, and status breakdowns) to guarantee absolute consistency with the main dashboard.

---

## 4. Referral Management Feature (`ReferralsPage.jsx`)

The Referral Management section provides an interactive affiliate portal displaying verified downlines, multi-tier network hierarchies, and commission audit logs.

### A. Endpoints Used
1. `GET /api/referrals/direct`:
   - Query Parameters: `page`, `limit`.
   - Returns paginated Level 1 direct affiliates with fields: `id`, `name`, `referralCode`, `isActive`, `createdAt`.
2. `GET /api/referrals/tree`:
   - Query Parameters: `maxDepth` (bounded between 1 and 10; default 5).
   - Traverses the referral tree level-by-level using breadth-first batch queries with cycle detection.
   - Returns `{ tree, metadata: { traversalDepth, maxTraversalDepth, totalMembers, hasMoreLevels } }`.
3. `GET /api/referrals/income`:
   - Query Parameters: `page`, `limit`, `status` (`pending`, `processed`, `failed`), `startDate`, `endDate`.
   - Returns `{ incomeRecords, summary: { processedIncomePaise, pendingIncomePaise, failedIncomePaise, totalIncomePaise }, pagination }`.
4. `GET /api/dashboard`:
   - Supplies authoritative overview metrics (`totalDirectReferrals`, `activeDirectReferrals`, `processedReferralIncomePaise`).

---

## 5. Daily ROI History & Earnings Analytics (`RoiHistoryPage.jsx`)

The ROI History and Analytics section provides an audited financial ledger of all daily return distributions along with interactive historical performance visualizations.

### A. Endpoints Used
1. `GET /api/roi/history`:
   - Query Parameters:
     - `page`: integer >= 1 (default: 1)
     - `limit`: integer 1..100 (default: 10)
     - `status`: `'pending' | 'processed' | 'failed'`
     - `startDate`: ISO 8601 date string
     - `endDate`: ISO 8601 date string
     - `investmentId`: MongoDB 24-character hex ObjectId
   - Returns populated records:
     `{ roiRecords: [{ _id, user, investment: { _id, planName, principalAmountPaise, status, startDate, endDate }, amountPaise, roiPercentageApplied, businessDate, status, transactionKey, createdAt }], pagination }`.
2. `GET /api/roi/summary`:
   - Returns user summary totals:
     `{ summary: { totalProcessedRoiPaise, processedCount, pendingCount, failedCount, totalRecords, latestPayout: { businessDate, amountPaise } } }`.
3. `GET /api/dashboard`:
   - Supplies `data.roi.chartData`: array of daily aggregated returns `{ businessDate, amountPaise, count }` sorted chronologically.

### B. UI Components
- **`RoiOverviewCards.jsx`**: Renders 4 KPI cards: Total Processed ROI (INR), Pending Executions, Total Distribution Events, and Latest Distribution payout with date.
- **`RoiAnalyticsChart.jsx`**: Responsive Recharts `AreaChart` plotting daily yield totals by calendar business date with custom INR tooltips and package count indicators.
- **`RoiFilterBar.jsx`**: Status filter pills (`All`, `Processed`, `Pending`, `Failed`), date range picker inputs (`startDate` & `endDate`), page-size dropdown selector (`10`, `20`, `50`), and reset action.
- **`RoiHistoryTable.jsx`**: Responsive desktop transaction table displaying Reference ID (copyable monospace), Business Date, Investment Plan badge (with link to `/investments/:id`), Principal Amount, Applied Daily Rate, ROI Yield in INR, and Processing Status badge.
- **`RoiHistoryCardList.jsx`**: Mobile-optimized card layout for screens `< 768px`.
- **`RoiPagination.jsx`**: Accessible pagination bar with record range information and windowed page numbers.
- **`RoiSkeleton.jsx`**: Pulse loading skeleton for cards, chart, and transaction list.

### C. Financial & Status Semantics
- **`processed`**: Confirmed batch distribution where wallet transactions were recorded and wallet balances credited.
- **`pending`**: Registered in queue awaiting the daily 12:00 AM IST cron execution. Strictly labeled as pending and excluded from available wallet credits.
- **`failed`**: Execution failed validation or transactional atomic constraints; documented and flagged for audit.
- **Backend Limitations**:
  - `GET /api/roi/summary` aggregates across all user contracts and does not return an investment-by-investment grouped array; individual investment earnings are inspected via `/api/investments/:id` or queried via `/api/roi/history?investmentId=...`.
  - Frontend never calculates, predicts, or estimates future daily ROI. All figures are strictly historical and server-authoritative.

---

## 6. Dashboard Implementation & Data Mapping (`DashboardPage.jsx`)

The dashboard directly consumes the actual payload returned by `GET /api/dashboard`.

### A. API Data Mapping
| UI Section | Backend Response Path | Field Type | Formatting / Display |
| :--- | :--- | :--- | :--- |
| **Total Invested** | `data.summary.totalInvestmentPaise` | Integer Paise | Formatted in INR (`₹...`) |
| **Active Principal** | `data.summary.activeInvestmentPaise` | Integer Paise | Formatted in INR (`₹...`) |
| **Total ROI Yield** | `data.summary.totalRoiPaise` | Integer Paise | Formatted in INR (`₹...`) |
| **Available Wallet** | `data.summary.walletBalancePaise` | Integer Paise | Formatted in INR (`₹...`) |
| **Referral Income** | `data.summary.processedReferralIncomePaise` | Integer Paise | Formatted in INR (`₹...`) |
| **Direct Affiliates** | `data.summary.totalDirectReferrals` | Integer | Total count + active affiliates count |
| **ROI Chart Series** | `data.roi.chartData` | Array | `[{ businessDate, amountPaise, count }]` |
| **Portfolio Allocation**| `data.investments.amountByStatus` | Array | `[{ status, count, amountPaise }]` |

---

## 7. Verification & Testing

```powershell
# Build frontend for production
npm --prefix frontend run build

# Run backend unit and integration test suites
npm --prefix backend test
```
