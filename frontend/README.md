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
│   ├── router.jsx                # React Router DOM configuration with route guards
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
│   │   └── investmentApi.js      # Endpoints: /investments (create, list, getById)
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
│   │   ├── InvestmentsPage.jsx   # Investment package listings with modal creation form
│   │   └── InvestmentDetailPage.jsx # Single investment contract inspection and yield details
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

## 3. Dashboard Implementation & Data Mapping (`DashboardPage.jsx`)

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
   - Responsive `PieChart` donut with status color coding:
     - `active`: `#10b981` (Emerald)
     - `pending`: `#f59e0b` (Amber)
     - `completed`: `#3b82f6` (Blue)
     - `cancelled`: `#f43f5e` (Rose)
   - Filters out zero-value statuses to avoid empty slices.
   - Hover tooltip displays status label, formatted amount in INR, and package count.

### C. Recent Activity Section (`RecentActivitySection.jsx`)
- **ROI Distributions Tab**: Lists recent daily payout records extracted directly from `roi.chartData` (sorted newest first, with date, amount, package count, and `CREDITED` badge).
- **Investments Tab**: Lists recent investments fetched via `useGetInvestmentsQuery({ limit: 5 })` with plan name, created date, amount in INR, and lifecycle status badge.

### D. Currency and Number Formatting (`formatters.js`)
All monetary values in the database are stored in **integer paise**. The frontend uses strict precision math:
- `amountRupees = amountPaise / 100`
- Regional Indian number grouping (`en-IN`) formatting: `formatPaiseToINR(paise)` produces `₹1,50,000.00`.
- Dates formatted via `Intl.DateTimeFormat('en-IN')`.

---

## 4. Verification & Testing

```powershell
# Build frontend for production
npm --prefix frontend run build

# Run backend unit and integration test suites
npm --prefix backend test
```
