# NexaChain – Product Functionality & Architectural Inventory Audit

**Audit Date:** November 6, 2026  
**Platform Version:** 1.0.0  
**Stack:** React 18 + Vite 6 + Tailwind CSS + Redux Toolkit + RTK Query + Express.js + Mongoose 8 + MongoDB

---

## 1. Executive Summary

This inventory audit establishes the true operational state of the NexaChain codebase prior to Milestone 1 remediations. Every feature has been traced across the full stack:
$$\text{UI Component} \longrightarrow \text{RTK Query Endpoint} \longrightarrow \text{Express Route} \longrightarrow \text{Controller \& Service} \longrightarrow \text{Mongoose Model \& MongoDB Collection}$$

Features are classified into five strict categories:
1. **Fully Functional:** Complete end-to-end integration with database, validation, error handling, and UI.
2. **Partially Functional:** Backend service/endpoint exists, but UI integration is incomplete or missing.
3. **UI Only / Dummy:** UI visual element or control present without supporting backend logic or transaction flow.
4. **Not Implemented:** Specified or referenced concept with neither backend endpoints nor complete frontend forms.
5. **Intentionally Disabled:** Fully implemented engine safely turned off by configuration pending commercial policy approval.

---

## 2. Complete Routes & Pages Inventory

| Route | Page Component | Access Guard | Layout Shell | Classification | Operational Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/login` | `LoginPage.jsx` | `PublicRoute` | `AuthLayout.jsx` | **Fully Functional** | Email + password login, JWT storage in Redux & localStorage, redirects on auth. Contains minor dummy controls (forgot password, remember me). |
| `/register` | `RegisterPage.jsx` | `PublicRoute` | `AuthLayout.jsx` | **Fully Functional** | Full validation, 10-digit Indian mobile number (+91), sponsor code pre-fill via `?ref=CODE`, atomic user creation with default `walletBalancePaise: 0`. |
| `/` | Redirect | — | — | **Fully Functional** | Redirects to `/dashboard`. |
| `/dashboard` | `DashboardPage.jsx` | `ProtectedRoute` | `AppLayout.jsx` | **Fully Functional** | Reads aggregated metrics from `GET /api/dashboard`. Contains 3 dummy header action buttons (Deposit, Withdrawal, Reinvest ROI). |
| `/investments` | `InvestmentsPage.jsx` | `ProtectedRoute` | `AppLayout.jsx` | **Partially Functional** | Read-only listing, status filtering (`all`, `active`, `pending`, `completed`, `cancelled`), and pagination work. **No UI form exists to create a new investment**. |
| `/investments/:id`| `InvestmentDetailPage.jsx` | `ProtectedRoute` | `AppLayout.jsx` | **Fully Functional** | Strict ownership isolation, contract dates, yield rate, principal, and total ROI earned. |
| `/referrals` | `ReferralsPage.jsx` | `ProtectedRoute` | `AppLayout.jsx` | **Fully Functional** | 3 tabs: Level-1 Direct Referrals list, interactive BFS Referral Tree visualizer with cycle detection, and Commission Income ledger. |
| `/roi-history` | `RoiHistoryPage.jsx` | `ProtectedRoute` | `AppLayout.jsx` | **Fully Functional** | 30-day analytics area chart, status and date range filtering, responsive transaction ledger, and pagination. |
| `/profile` | `ProfilePage.jsx` | `ProtectedRoute` | `AppLayout.jsx` | **Fully Functional** | User ID, email, sponsor linkage, referral code sharing tools, read-only policy disclaimer, sign out. (Mobile number previously omitted from display). |
| `*` | `NotFoundPage.jsx` | None | None | **Fully Functional** | 404 fallback with return-to-dashboard navigation. |

---

## 3. Interactive Controls & UI Elements Audit

| Component | Control / Label | Current Behavior | Classification | Remediation Decision |
| :--- | :--- | :--- | :--- | :--- |
| `AppLayout.jsx` | Available Balance `+` button | Navigates to `/investments` | **UI Only / Dummy** | **Remove button.** No payment gateway or deposit endpoint exists in this milestone. |
| `AppLayout.jsx` | Available Balance `↑` button | Navigates to `/investments` | **UI Only / Dummy** | **Remove button.** No withdrawal workflow or bank transfer endpoint exists. |
| `AppLayout.jsx` | Notification Bell icon | No click handler, empty button | **UI Only / Dummy** | **Remove button.** No notification model or service exists. |
| `AppLayout.jsx` | Breadcrumbs (`Platform > ...`) | Hardcoded to `Platform > Dashboard` on all pages | **UI Only / Dummy** | **Make route-aware** using `useLocation().pathname`. |
| `AppLayout.jsx` | Footer Protocol claim | "Protocol Version 4.1.8-mainnet" | **Dummy Text** | **Replace with** "NexaChain Capital Platform • Version 1.0.0". |
| `DashboardPage.jsx`| "Deposit Funds" Header CTA | `<Link to="/investments">` | **UI Only / Dummy** | **Remove CTA.** Misleading navigation without a deposit flow. |
| `DashboardPage.jsx`| "Withdrawal" Header CTA | `<Link to="/investments">` | **UI Only / Dummy** | **Remove CTA.** Misleading navigation without a withdrawal flow. |
| `DashboardPage.jsx`| "Reinvest ROI" Header CTA | `<Link to="/investments" onClick={refetch}>` | **UI Only / Dummy** | **Remove CTA.** Misleading navigation labeled as a reinvestment transaction. |
| `DashboardPage.jsx`| "Paise Precision v2.4" badge | Static text badge | **Dummy Text** | **Replace with** clean "Integer Paise Precision" indicator. |
| `LoginPage.jsx` | "Remember this session" checkbox | Toggles local state, not used in auth | **UI Only / Dummy** | **Remove checkbox.** Eliminates decorative non-functional state. |
| `LoginPage.jsx` | "Forgot password?" link | Plain unclickable `<span>` | **UI Only / Dummy** | **Remove link.** Password recovery service is out of scope for this milestone. |
| `AuthLayout.jsx` | `+2.5% Referral Boost` | Marketing badge | **Dummy Text** | **Remove badge.** Unsupported marketing claim. |
| `AuthLayout.jsx` | `KYC-Free Up to $50K` | Marketing trust bullet | **Dummy Text** | **Remove text.** Uses wrong currency ($ vs ₹) and references non-existent KYC. |
| `AuthLayout.jsx` | "Instant on-chain referral rebates" | Marketing copy | **Dummy Text** | **Replace with** accurate institutional portfolio terminology. |
| `RecentActivitySection.jsx` | `txHash: TX-${id}` | Formats Mongo ObjectId as blockchain hash | **Dummy Text** | **Replace with** `ref: REF-${id}` transaction record identifier. |
| `ProfilePage.jsx` | Mobile Number display | Omitted from Account Specifications | **Partially Functional** | **Display mobileNumber** from authenticated `GET /api/auth/me` response. |

---

## 4. Backend APIs, Middleware & Service Traceability

| Endpoint | Method | Middleware | Controller & Service | Database Collections | Classification | Notes |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | `validate(registerSchema)` | `authController.register` | `users` | **Fully Functional** | Normalizes Indian mobile number (+91), hashes password with bcrypt (10 rounds), generates unique referral code. |
| `/api/auth/login` | `POST` | `validate(loginSchema)` | `authController.login` | `users` | **Fully Functional** | Compares bcrypt hash, checks `isActive`, issues signed JWT (1d). |
| `/api/auth/me` | `GET` | `authMiddleware` | `authController.getMe` | `users` | **Fully Functional** | Returns sanitized user profile, mobile number, wallet balance, and referral code. |
| `/api/auth/admin-check` | `GET` | `authMiddleware`, `roleMiddleware('admin')` | `authController.adminCheck` | `users` | **Fully Functional** | Returns 403 Forbidden for non-admin accounts. |
| `/api/dashboard` | `GET` | `authMiddleware`, `validateQuery` | `dashboardService.getDashboardData` | `users`, `investments`, `roi_histories` | **Fully Functional** | Parallel aggregation for portfolio overview, daily ROI in `Asia/Kolkata`, and chart series. |
| `/api/investments` | `POST` | `authMiddleware`, `validate(createInvestmentSchema)` | `investmentService.createInvestment` | `investments` | **Partially Functional** | Creates investment in `pending` status using server plan rates. **Missing UI invocation and activation endpoint**. |
| `/api/investments` | `GET` | `authMiddleware`, `validateQuery` | `investmentService.getUserInvestments` | `investments` | **Fully Functional** | Scoped strictly to `req.user._id`, paginated, filterable by status. |
| `/api/investments/:id` | `GET` | `authMiddleware`, `validateParams` | `investmentService.getInvestmentById` | `investments` | **Fully Functional** | Scoped strictly to `req.user._id`; returns 404 if not owned. |
| `/api/referrals/direct` | `GET` | `authMiddleware`, `validateQuery` | `referralService.getDirectReferrals` | `users` | **Fully Functional** | Paginated Level-1 downline listing. |
| `/api/referrals/tree` | `GET` | `authMiddleware`, `validateQuery` | `referralService.getReferralTree` | `users` | **Fully Functional** | BFS tree traversal with cycle detection and depth limiting. |
| `/api/referrals/income` | `GET` | `authMiddleware`, `validateQuery` | `referralService.getReferralIncome` | `referral_incomes` | **Fully Functional** | Commission ledger with status and date filtering. |
| `/api/referrals/process` | `POST` | `authMiddleware`, `roleMiddleware('admin')`, `validateBody` | `referralCommissionService.processReferralCommissions` | `referral_incomes`, `users`, `wallet_transactions` | **Intentionally Disabled** | Multi-level commission engine. Disabled by default (`REFERRAL_COMMISSION_ENABLED: false`) pending approved rates. |
| `/api/roi/history` | `GET` | `authMiddleware`, `validate(roiHistoryQuerySchema, 'query')` | `roiService.getUserRoiHistory` | `roi_histories` | **Defective Middleware** | `validate` only validates `req.body`, leaving `req.query` unvalidated. **Fixed to `validateQuery` in Phase 2**. |
| `/api/roi/summary` | `GET` | `authMiddleware` | `roiService.getUserRoiSummary` | `roi_histories` | **Fully Functional** | Aggregates user lifetime ROI earnings and status counts. |
| `/api/roi/process` | `POST` | `authMiddleware`, `roleMiddleware('admin')`, `validate(processRoiSchema, 'body')` | `roiController.triggerDailyRoi` | `investments`, `roi_histories`, `users`, `wallet_transactions` | **Fully Functional** | Manual trigger for daily ROI batch run with distributed locking and ACID transactions. |

---

## 5. RTK Query Endpoints & Mutation Coverage

| RTK Query Module | Endpoint Hook | Underlying HTTP Route | Consumed In Frontend? | Status |
| :--- | :--- | :--- | :---: | :--- |
| `authApi.js` | `useLoginMutation` | `POST /api/auth/login` | Yes (`LoginPage.jsx`) | **Active** |
| `authApi.js` | `useRegisterMutation` | `POST /api/auth/register` | Yes (`RegisterPage.jsx`) | **Active** |
| `authApi.js` | `useGetMeQuery` | `GET /api/auth/me` | Yes (`ProfilePage.jsx`) | **Active** |
| `dashboardApi.js` | `useGetDashboardDataQuery` | `GET /api/dashboard` | Yes (`DashboardPage.jsx`, `InvestmentsPage.jsx`, `ReferralsPage.jsx`, `RoiHistoryPage.jsx`) | **Active** |
| `investmentApi.js` | `useCreateInvestmentMutation` | `POST /api/investments` | **No** (Unused across UI) | **Orphaned Mutation** |
| `investmentApi.js` | `useGetInvestmentsQuery` | `GET /api/investments` | Yes (`InvestmentsPage.jsx`, `RecentActivitySection.jsx`) | **Active** |
| `investmentApi.js` | `useGetInvestmentByIdQuery` | `GET /api/investments/:id` | Yes (`InvestmentDetailPage.jsx`) | **Active** |
| `referralApi.js` | `useGetDirectReferralsQuery` | `GET /api/referrals/direct` | Yes (`DirectReferralsList.jsx`) | **Active** |
| `referralApi.js` | `useGetReferralTreeQuery` | `GET /api/referrals/tree` | Yes (`ReferralTreeView.jsx`, `ReferralsPage.jsx`) | **Active** |
| `referralApi.js` | `useGetReferralIncomeQuery` | `GET /api/referrals/income` | Yes (`ReferralIncomeHistory.jsx`, `ReferralsPage.jsx`) | **Active** |
| `roiApi.js` | `useGetRoiHistoryQuery` | `GET /api/roi/history` | Yes (`RoiHistoryPage.jsx`, `RecentActivitySection.jsx`) | **Active** |
| `roiApi.js` | `useGetRoiSummaryQuery` | `GET /api/roi/summary` | Yes (`RoiHistoryPage.jsx`) | **Active** |
| `walletApi.js` | `useGetWalletOverviewQuery` | `GET /api/dashboard` (transformed) | No (Direct dashboard query used) | **Redundant Query** |

---

## 6. Financial Configuration & Solvency Safeguards

| Parameter | Current Value / Setting | Commercial Status | Safety Guard |
| :--- | :--- | :--- | :--- |
| **Monetary Representation** | Integer paise (₹1 = 100 paise) | Authoritative Platform Standard | Prevents IEEE 754 floating-point rounding errors. Validated on all models. |
| **ROI Rounding Mode** | `FLOOR` (`Math.floor`) | Authoritative Solvency Rule | Truncates fractional paise to prevent liability creation without backing funds. |
| **Scheduler Timezone** | `Asia/Kolkata` (`00:00 IST`) | Authoritative Cron Schedule | Normalized calendar business days; distributed lock lease 10 min, heartbeat 30 sec. |
| **Investment Plans** | Starter (1.0%, 30d), Growth (1.5%, 60d), Premium (2.0%, 90d) | **Technical Illustrative Presets** | Documented in `plans.js` as test presets. Arbitrary client plan injection forbidden. |
| **Referral Commission Rates**| `IS_ENABLED: false` | **Intentionally Disabled** | Safely blocked in `referralCommissionConfig.js` until stakeholder approval. |

---

## 7. Action Plan for Milestone 1

1. **Phase 2:**
   - Fix `backend/src/routes/roiRoutes.js` to use `validateQuery(roiHistoryQuerySchema)`.
   - Add comprehensive validation tests for invalid/negative page, invalid limit, invalid status, invalid date range.
   - Perform safe, non-destructive backup of `nexachain` database before any data reconciliation.
   - Produce a reconciliation report for user Shan's test account.
2. **Phase 3:**
   - Remove Deposit Funds and Withdrawal buttons/links from `AppLayout.jsx` and `DashboardPage.jsx`.
   - Remove fake "Reinvest ROI" action from `DashboardPage.jsx`.
   - Remove "Forgot password?" plain span from `LoginPage.jsx`.
   - Remove "Remember this session" checkbox from `LoginPage.jsx`.
   - Remove static Notification Bell from `AppLayout.jsx`.
   - Implement route-aware breadcrumbs in `AppLayout.jsx`.
   - Display `mobileNumber` in `ProfilePage.jsx` with fallback for missing values.
3. **Phase 4 & 5:**
   - Strip out all crypto/blockchain buzzwords, fake transaction hashes, and unsupported marketing percentages.
   - Refine UI to a calm, restrained fintech design.
4. **Phase 6 & 7:**
   - Ensure all remaining controls work predictably.
   - Run backend test suite (151 tests) and frontend production build.

---

## 8. Milestone 1 Remediation Outcomes & Verification Summary

| Remediation Item | Target File(s) | Action Taken | Verification |
| :--- | :--- | :--- | :--- |
| **ROI Query Validation Defect** | `backend/src/routes/roiRoutes.js`<br>`backend/src/tests/roi.test.js` | Updated `GET /api/roi/history` to use `validateQuery(roiHistoryQuerySchema)`. Added 8 validation tests for negative page, invalid limit, inverted date range, invalid status, and malformed dates. | ✅ Passed (19/19 tests in `roi.test.js`) |
| **Shan & Akash Financial Reconciliation** | `backend/scripts/reconcileFinancialBalances.js`<br>`backend/scripts/backupDatabase.js` | Backed up DB to `backend/backups/`. Reconciled Shan's unbacked totals to 0 to match 0-row history truth. Preserved ₹10,000 balances with explicit audit ledger rows (`opening_balance_<userId>`). | ✅ 0 Discrepancies across all accounts |
| **Deposit / Withdrawal Dummy Links** | `AppLayout.jsx`<br>`DashboardPage.jsx` | Removed dead `+` and `↑` sidebar buttons and misleading header links. Header now features a clean "Refresh Data" action and "View Investments" link. | ✅ Clean, honest UX |
| **Reinvest ROI Fake Action** | `DashboardPage.jsx` | Removed pseudo-action button. Reinvest workflow will only be added with atomic wallet balance debiting. | ✅ Removed |
| **Forgot Password & Remember Me** | `LoginPage.jsx` | Removed unbacked plain span and non-functional checkbox. | ✅ Clean login card |
| **Notification Bell Static Icon** | `AppLayout.jsx` | Removed non-interactive bell button. | ✅ Clean header |
| **Route-Aware Dynamic Breadcrumbs** | `AppLayout.jsx` | Implemented dynamic breadcrumb resolution mapping current pathname (`Platform > Dashboard`, `Platform > Investments`, etc.). | ✅ Route-aware navigation |
| **Profile Mobile Number Display** | `ProfilePage.jsx` | Added registered mobile number to both the header contact row and Account Specifications card with fallback for missing values. | ✅ Dynamic display |
| **Misleading Marketing & Buzzwords** | `AuthLayout.jsx`<br>`AppLayout.jsx`<br>`RecentActivitySection.jsx` | Removed +2.5% boost, KYC $50K, on-chain/mainnet claims, and fake `TX-` hashes (replaced with `REF-` references). | ✅ Truthful fintech copy |
| **Full Automated Test Suite** | Backend (`npm test`) | 151 / 151 tests passing across all 9 suites (100% pass rate). | ✅ 151 / 151 Passed |
| **Frontend Production Build** | Frontend (`npm run build`) | Vite v6.4.5 compilation passed with 0 errors and 0 warnings. | ✅ Built in 13.18s |

