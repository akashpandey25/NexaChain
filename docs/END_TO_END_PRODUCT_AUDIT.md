# NexaChain – End-to-End Product & UX Audit

**Date:** November 2026  
**Auditor:** Senior Full-Stack MERN & Product Engineer  
**Repository:** https://github.com/akashpandey25/NexaChain.git  
**Branch:** `main`  
**Baseline Commit:** `e60e2b9`

---

## 1. Executive Summary

This comprehensive audit evaluates the end-to-end user journeys, functional integrity, visual consistency, financial language compliance, and accessibility of the NexaChain Investment & Referral Management Platform.

Each route, user journey, modal, form, and interactive element was walked through and classified under one of five standard operational states:
- **Working Correctly:** Fully functional with end-to-end integration to backend APIs, proper loading/error states, and consistent UI feedback.
- **Partially Working:** Core functionality operates, but minor UX ambiguities, inconsistent edge-case labels, or missing keyboard shortcuts existed.
- **Broken:** Interaction throws an error or behaves contrary to system specifications.
- **UI-Only:** Visual mockup element without functional backend backing (removed or remediated).
- **Intentionally Unavailable:** Functionality that is explicitly gated or disabled by safety policy (e.g. `INVESTMENT_ACTIVATION_ENABLED=false`, `REFERRAL_COMMISSION_ENABLED=false`).

---

## 2. Route & Screen Walkthrough Classification

| Route | View Component | Access Role | Initial Classification | Remediated Status | Key Observations & Remediations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/login` | `LoginPage.jsx` | Public (`PublicRoute`) | Working Correctly | **Working Correctly** | Full validation, show/hide password, error banners, redirect to requested location. |
| `/register` | `RegisterPage.jsx` | Public (`PublicRoute`) | Partially Working | **Working Correctly** | Removed misleading client-only "Sponsor Verified" pill triggered on $\ge 3$ characters; standardized +91 Indian mobile prefix; password strength meter. |
| `/dashboard` | `DashboardPage.jsx` | Authenticated (`user`/`admin`) | Partially Working | **Working Correctly** | Fixed referral banner claiming "5% - 3% - 1% Tier Network" when commissions are inactive; aligned referral link display to actual copied URL; real-time integer paise KPIs. |
| `/investments` | `InvestmentsPage.jsx` | Authenticated (`user`/`admin`) | Working Correctly | **Working Correctly** | Status filter tabs, pagination, "Create Investment" modal, plain-language lifecycle guide. |
| `/investments/:id` | `InvestmentDetailPage.jsx` | Authenticated (Owner only) | Partially Working | **Working Correctly** | Replaced `window.location.assign` with React Router navigation; fixed pending contract date labels (no longer showing "Ongoing/Indefinite" for pending requests); audit timestamp display. |
| `/admin/investments` | `AdminInvestmentsPage.jsx` | Admin Only (`role: 'admin'`) | Partially Working | **Working Correctly** | Added Escape-key and backdrop-click handlers to inspection, activation, and rejection modals; enforced mandatory rejection reasons; disabled-gate feedback. |
| `/roi-history` | `RoiHistoryPage.jsx` | Authenticated (`user`/`admin`) | Working Correctly | **Working Correctly** | Status filtering, date-range inputs, responsive table/card views, zero floating-point math. |
| `/referrals` | `ReferralsPage.jsx` | Authenticated (`user`/`admin`) | Working Correctly | **Working Correctly** | Direct downline list with pagination, recursive tree view with cycle bounds and depth selectors, commission ledger with policy compliance banner. |
| `/profile` | `ProfilePage.jsx` | Authenticated (`user`/`admin`) | Working Correctly | **Working Correctly** | Read-only legal profile data, copy referral code/link, dual-layer logout (Redux + RTK Query cache wipe). |
| `*` (404) | `NotFoundPage.jsx` | Public | Working Correctly | **Working Correctly** | Clear 404 messaging with return-to-dashboard navigation. |

---

## 3. User Journey Analysis

### Journey A — Authentication & Session Management
1. **Registration:**
   - Input validation: Full name ($\ge 2$ chars), email regex, 10-digit Indian mobile number (`^[6-9]\d{9}$`), password ($\ge 8$ chars, 1 letter, 1 number), password match, terms agreement.
   - Referral Code: Optional sponsor code input. Pre-filled from `?ref=...` query parameter.
   - *Audit Fix:* Removed pseudo-validation badge claiming "Sponsor Verified" prior to server response.
   - *Status:* **Working Correctly**.
2. **Login:**
   - Validates email and password; surfaces backend error messages cleanly (`HTTP 401`, `HTTP 400`).
   - Session token persisted to `localStorage` via `tokenStorage.js`.
   - *Status:* **Working Correctly**.
3. **Protected Route Guard:**
   - `ProtectedRoute.jsx` intercepts unauthenticated visitors and redirects to `/login` preserving intended destination in `location.state.from`.
   - Session hydration in `App.jsx` verifies token with `GET /api/auth/me`.
   - *Status:* **Working Correctly**.
4. **Logout:**
   - Clears JWT token from `localStorage`, resets `authSlice` state, and wipes all RTK Query cache (`baseApi.util.resetApiState()`) to prevent data leakage across accounts.
   - *Status:* **Working Correctly**.

---

### Journey B — Investment Request Lifecycle (Investor Perspective)
1. **Plan Discovery:**
   - Loads authorized server plans dynamically from `GET /api/investments/plans`.
   - Clearly flags plans with illustrative testing defaults (*"Illustrative technical default rates for demonstration"*).
2. **Request Submission:**
   - User inputs investment principal in Indian Rupees (INR); modal computes exact integer paise in real time.
   - Submits `POST /api/investments` with `planName` and `principalAmountPaise`.
   - Record created with `status: 'pending'`.
3. **Funding & Ledger Semantics:**
   - Explicitly communicates: **"No wallet balance is debited or transferred at this time."**
   - User wallet balance remains untouched ($0.00$ or existing balance).
   - *Audit Fix:* In `RecentActivitySection.jsx`, pending requests are titled `Investment Request: <Plan>` with neutral amount `₹...` (no misleading minus sign `-₹...` or "Deployed" status).
4. **Detail Inspection:**
   - `/investments/:id` displays pending request banner, submission timestamp, and explicit note that yield accrues strictly upon administrative activation.
   - *Audit Fix:* Contract start/end dates for pending requests are labeled `"Pending activation"` rather than misleadingly displaying the creation date or `"Indefinite"`.
   - *Status:* **Working Correctly**.

---

### Journey C — Administrative Review & Approval Workflow
1. **Access Control:**
   - Guarded by `AdminRoute.jsx` (`user.role === 'admin'`). Ordinary users are redirected to `/dashboard`.
   - Backend APIs (`GET /api/investments/admin/pending`, `PATCH .../activate`, `PATCH .../reject`) strictly enforce `authorizeRoles('admin')` (`HTTP 403`).
2. **Pending Request Review:**
   - Admin reviews applicant contact details (`name`, `email`, `mobileNumber`), investment ID, and requested principal.
3. **Inspection Drawer / Modal:**
   - Clean popover with one-click copy of reference ID and applicant parameters.
4. **Rejection Decision:**
   - Enforces a mandatory audit reason (3–500 characters).
   - Calls `PATCH /api/investments/:id/reject`, transitioning status to `'cancelled'`, recording `rejectionReason`, `actionedBy`, and `actionedAt`.
5. **Activation Decision & Safety Gate:**
   - Gated by `INVESTMENT_ACTIVATION_ENABLED=false` by default.
   - When disabled, modal warns the administrator that activation is locked by policy.
   - 4-eye policy: Administrators cannot activate their own investment requests (`HTTP 403`).
   - *Status:* **Working Correctly**.

---

### Journey D — Dashboard, Analytics & Financial Ledgers
1. **Portfolio Overview:**
   - Stat cards accurately reflect `totalInvestmentPaise`, `activeInvestmentPaise`, `totalRoiPaise`, and `walletBalancePaise` formatted via `Intl.NumberFormat('en-IN')`.
   - Zero floating-point rounding errors.
2. **Data Refresh:**
   - "Refresh Data" action button in header triggers `refetch()` on `useGetDashboardDataQuery()`, spinning the icon and updating all cards and charts.
3. **ROI History & Analytics:**
   - Paginated historical payout records from `GET /api/roi/history`.
   - Filterable by status (`processed`, `pending`, `failed`) and date range (`startDate`, `endDate`).
   - Timezone: Autoritative `Asia/Kolkata` midnight IST dates displayed without browser offset distortion.
4. **Referral Management:**
   - Direct referrals (Level 1) paginated table and mobile card view.
   - Interactive tree visualization with depth controls (3, 5, 8, 10 levels) and cycle detection.
   - Referral commission history with clear governance disclaimer indicating commission processing is inactive by commercial policy.
   - *Status:* **Working Correctly**.

---

## 4. Discovered Issues & Remediations Matrix

| # | Component / File | Issue Description | Severity | Remediation Applied |
|---|---|---|---|---|
| 1 | `RegisterPage.jsx` | Misleading "Sponsor Verified" badge rendered purely on `referralCode.length >= 3` without server verification. | Medium | Replaced with neutral code badge indicating code entered; preserved valid server error handling on submit. |
| 2 | `DashboardPage.jsx` | Referral card displayed "Tier Network (5% - 3% - 1%)" and "3 Levels Active", implying active commission payouts. | Medium | Updated badge to "Referral Network (Commission Inactive by Policy)" to honestly reflect system status. |
| 3 | `DashboardPage.jsx` | Displayed `nexachain.io/ref/<code\>` while copy button actually copied `${window.location.origin}/register?ref=<code\>`. | Low | Synchronized display string to show actual host URL. |
| 4 | `RecentActivitySection.jsx` | Pending investment requests were titled "Package Activation" with negative amount `-₹...` and status "DEPLOYED". | High | Fixed mapping: pending investments now title "Investment Request", display neutral amount `₹...`, and status "Pending Review". |
| 5 | `InvestmentsTable.jsx` | End date showed "Indefinite" for pending contracts before start date was established. | Medium | Updated to display "Pending Activation" for contracts awaiting review. |
| 6 | `InvestmentsCardList.jsx` | End date showed "Ongoing" for pending contracts on mobile cards. | Medium | Updated to display "Pending Activation" for contracts awaiting review. |
| 7 | `InvestmentDetailPage.jsx` | Start date showed `createdAt` and end date showed "Ongoing / Indefinite" for pending requests; full page reload on back button. | Medium | Replaced `window.location.assign` with client router; labeled start and end dates as "Pending administrative activation". |
| 8 | `AdminInvestmentsPage.jsx` | Modals lacked Escape key listener, backdrop click dismissal, and proper dialog labeling. | Medium | Added `useEffect` for `keydown` (Escape key), backdrop click handlers, and `aria-labelledby` attributes. |
| 9 | `authApi.js` | `register` mutation only invalidated `['Auth']` instead of all feature tags, potentially leaking old cached data. | Medium | Updated `invalidatesTags` to include `['Auth', 'Dashboard', 'Investment', 'Referral', 'ROI']`. |

---

## 5. Visual Consistency & Usability Standards

- **Color Hierarchy:** Restrained slate palette (`#070b13`, `#090d16`, `#0b101b`, `slate-800`, `slate-900`) with emerald accents used strictly for positive financial states (verified balances, active contracts) and amber for pending items.
- **Typography:** Standardized sans-serif font with tabular monospace numerals for currency, dates, reference IDs, and referral codes.
- **Button Standards:** Primary action buttons use emerald fills; secondary/destructive buttons use subtle borders and dark tones.
- **No Marketing Hype:** Eliminated claims of guaranteed returns, liquidity guarantees, or instant withdrawals. All plan configurations carry clear demonstration/testing notices.
- **Responsive Layout:** Tested at desktop (1440px, 1280px), tablet (768px), and mobile (375px, 390px, 414px) with zero horizontal overflow.

---

## 6. Automated Browser Verification Results (Playwright)

End-to-end browser tests run against the integrated frontend and backend via Chromium:

```bash
npx playwright test
```

### Test Results Summary: 15 / 15 Passed (31.6s)

1. **User Journey A — Authentication & Session Management (`e2e/journey-a-auth.spec.js`)**
   - `1. Validates form fields and displays clear error messages on invalid input`: **PASSED** (1.4s)
   - `2. Successfully registers a new user and authenticates into the dashboard`: **PASSED** (1.1s)
   - `3. Enforces protected route behavior and navigates between authorized views`: **PASSED** (2.2s)
   - `4. Logs out successfully and blocks subsequent access to protected routes`: **PASSED** (1.2s)
   - `5. Rejects duplicate email registration with clear feedback`: **PASSED** (1.1s)

2. **User Journey B — Investment Request Lifecycle & Funding Semantics (`e2e/journey-b-investment.spec.js`)**
   - `1. Submits an investment request and verifies unfunded semantics and pending status`: **PASSED** (3.7s)

3. **User Journey C — Administrative Review Workflow & Security Guards (`e2e/journey-c-admin.spec.js`)**
   - `1. Enforces role security: ordinary users are blocked from Admin Approvals`: **PASSED** (3.3s)
   - `2. Admin logs in, inspects the pending request, and rejects with an auditable reason`: **PASSED** (1.5s)
   - `3. Investor verifies the rejection decision and audit reason on the contract details view`: **PASSED** (1.4s)
   - `4. Verifies production fail-safe lockout when attempting activation with flag disabled`: **PASSED** (3.3s)

4. **User Journey D — Dashboard, Records, Filters & Refresh Verification (`e2e/journey-d-dashboard.spec.js`)**
   - `1. Verifies dashboard KPI values, charts, and interactive refresh action`: **PASSED** (1.3s)
   - `2. Tests Investments page status filters, page sizes, and empty states`: **PASSED** (1.5s)
   - `3. Tests ROI History page filters, date controls, and empty states`: **PASSED** (1.6s)
   - `4. Tests Referrals page tabs (Direct, Tree, Income) and depth controls`: **PASSED** (1.3s)
   - `5. Tests Profile page credentials copy, information display, and immutability notice`: **PASSED** (1.1s)


