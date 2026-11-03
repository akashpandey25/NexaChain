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
│   │   └── referralApi.js        # Endpoints: /referrals/direct, /referrals/tree, /referrals/income
│   ├── roi/
│   │   └── roiApi.js             # Endpoints: /roi/history, /roi/summary
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
│   │   └── RegisterPage.jsx      # Registration form with password match check and show/hide controls
│   ├── dashboard/
│   │   └── DashboardPage.jsx     # Full data-driven dashboard integrating all metrics & Recharts
│   ├── investments/
│   │   ├── InvestmentsPage.jsx   # Investments portfolio: KPI overview, filters, table, cards & pagination
│   │   └── InvestmentDetailPage.jsx # Dedicated /investments/:id contract inspector & lifecycle breakdown
│   ├── referrals/
│   │   └── ReferralsPage.jsx     # Referral code share card, direct affiliates, tree view, commission log
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

### B. UI Components
- **`InvestmentsOverview.jsx`**: Displays 4 high-level metric cards: Total Invested Principal, Active Capital, Total Packages, and Active Contracts, accompanied by an interactive status chip breakdown.
- **`InvestmentsFilterBar.jsx`**: Server-side status filters (`All`, `Active`, `Pending`, `Completed`, `Cancelled`) with live badge counts, page-size selector, and clear filter button.
- **`InvestmentsTable.jsx`**: Clean desktop table displaying Reference ID (copyable monospace), Plan Name badge, Principal Amount in INR, ROI Rate, Start Date, End Date, Status badge, and View Details action.
- **`InvestmentsCardList.jsx`**: Touch-optimized card list for mobile viewport (< 768px), preventing horizontal overflow.
- **`InvestmentsPagination.jsx`**: Accessible pagination bar with record range information ("Showing 1 to 10 of 25 investments"), previous/next buttons, and windowed page numbers.
- **`InvestmentsSkeleton.jsx` & `InvestmentDetailSkeleton.jsx`**: Responsive pulse skeletons for smooth layout transitions during network fetches.
- **`InvestmentDetailPage.jsx`**: Dedicated `/investments/:id` view presenting contract specifications, accumulated ROI yield, daily rate, verified calendar dates, and security governance notices.

### C. Backend Limitations & Unsupported Features
- **Full-Text / ID Search**: The backend Zod schema (`listInvestmentsQuerySchema`) strictly validates query parameters and only accepts `page`, `limit`, and `status`. Arbitrary client query parameters are filtered out by Zod. Client-side search over a partial page was intentionally omitted to prevent misleading users into believing their search covers their entire historical portfolio.
- **Client-Side Creation & Modification**: Modification of investment status, ownership, or ROI yields is strictly forbidden by the server; all lifecycle transitions are driven by server cron batch processes.

---

## 4. Dashboard Implementation & Data Mapping (`DashboardPage.jsx`)

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

### B. Visualizations with Recharts
1. **ROI Yield History (`RoiHistoryChart.jsx`)**:
   - Responsive `AreaChart` with emerald gradient fill and stroke.
   - X-Axis displays business dates formatted as `DD MMM` (e.g. `03 Nov`).
   - Y-Axis dynamically scales values converted from paise to Rupees.
   - Accessible hover tooltip displays exact formatted date, INR amount, and package count.
   - Renders a clean empty state when no distributions have been processed yet.
2. **Portfolio Allocation Donut Chart (`InvestmentDistributionChart.jsx`)**:
   - Responsive `PieChart` donut with status color coding (`active`, `pending`, `completed`, `cancelled`).
   - Filters out zero-value statuses to avoid empty slices.
   - Hover tooltip displays status label, formatted amount in INR, and package count.

### C. Activity Semantics
- **ROI Transactions Tab**: Queries `GET /api/roi/history` (`limit: 5`) for genuine individual distribution records with confirmed status (`PROCESSED`, `PENDING`, `FAILED`).
- **Investments Tab**: Queries `GET /api/investments` (`limit: 5`) for recent plan contracts.
- **Daily ROI Summary Tab**: Displays daily aggregated yield totals from `roi.chartData` with an explicit notice that entries represent aggregated daily earnings.

### D. Currency and Number Formatting (`formatters.js`)
All monetary values in the database are stored in **integer paise**. The frontend uses strict precision math:
- `amountRupees = amountPaise / 100`
- Regional Indian number grouping (`en-IN`) formatting: `formatPaiseToINR(paise)` produces `₹1,50,000.00`.
- Timezone-safe calendar dates formatted via `formatBusinessDate(date)` avoiding day-shifts in Western timezones.

---

## 5. Verification & Testing

```powershell
# Build frontend for production
npm --prefix frontend run build

# Run backend unit and integration test suites
npm --prefix backend test
```
