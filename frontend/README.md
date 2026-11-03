# NexaChain Frontend Documentation

## 1. Overview

The NexaChain frontend is built with React 18, Vite 6, Tailwind CSS 3, and Redux Toolkit with RTK Query. It provides a responsive financial dashboard interface with a clean fintech aesthetic, featuring neutral dark surfaces (`slate-950`/`slate-900`) and restrained emerald accents (`emerald-500`/`emerald-600`).

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
│   │   └── dashboardApi.js       # Endpoints: /dashboard with cache tags
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
│   │   └── DashboardPage.jsx     # KPI metric cards, quick-action navigation, and summary cards
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
│   └── tokenStorage.js           # Safe token getter/setter with documented security trade-offs
├── App.jsx                       # Root app component handling session hydration and RouterProvider
├── main.jsx                      # React DOM root entry wrapping <Provider store={store}>
└── index.css                     # Tailwind CSS entry directives
```

---

## 3. Responsive App Shell (`AppLayout.jsx`)

The application layout provides a responsive structure across mobile, tablet, and desktop viewports:

- **Desktop Sidebar Navigation (`md:flex md:w-64 md:fixed`)**:
  - Persistent left sidebar with brand identity, active link states with emerald borders/accents (`bg-emerald-500/10 text-emerald-400`), live wallet balance, and user summary badge.
  - Links: `Dashboard`, `Investments`, `Referrals`, `ROI History`, `Profile`.
- **Mobile Navigation Drawer (`md:hidden`)**:
  - Sliding drawer triggered by a top hamburger toggle with smooth transition and dark backdrop overlay.
  - Automatically closes upon navigation link selection or backdrop click.
- **Top Navigation Bar (`sticky top-0 z-20`)**:
  - Dynamic page title derived from the current route path.
  - Real-time wallet balance indicator (`₹...` formatted in Indian Rupees from persisted integer paise).
  - User avatar initial and quick Sign Out button.
- **Sign Out Action**:
  - Dispatches `logout()` to wipe authentication credentials from Redux state and `localStorage`.
  - Dispatches `baseApi.util.resetApiState()` to flush all user-specific RTK Query caches, preventing cross-user data leakage.
  - Redirects to `/login`.

---

## 4. Authentication Flow

### Login (`LoginPage.jsx`)
- **Inputs**: Email and Password.
- **Show/Hide Password**: Accessible toggle button with `Eye` / `EyeOff` icons.
- **Client-Side Validation**:
  - Required check for email and password.
  - Regex validation for email format.
- **State Integration**:
  - Calls `useLoginMutation()` from `authApi`.
  - On 200 OK: Redux `authSlice` updates with JWT `token` and user object; persists token in `localStorage`.
  - Redirects to the attempted route (`location.state.from`) or default `/dashboard`.
  - On error: displays server message and specific field errors via `<ErrorMessage />`.

### Registration (`RegisterPage.jsx`)
- **Inputs**: Full Name, Email, Password, Confirm Password, and optional Referral Code.
- **Show/Hide Password**: Independent visibility toggles for Password and Confirm Password.
- **Client-Side Validation**:
  - Name: required, min 2, max 100 characters.
  - Email: required, valid email format regex.
  - Password: required, min 8 characters, at least 1 letter and 1 digit (strictly aligned with backend regex `/^(?=.*[a-zA-Z])(?=.*\d)/`).
  - Confirm Password: required, must strictly match password.
  - Referral Code: optional, uppercase, min 3 characters if provided.
- **Backend Contract**:
  - Only sends `{ name, email, password, referralCode }` to `POST /api/auth/register`.
  - The backend returns HTTP 201 with `{ success: true, message: ..., data: { user, token } }`.
  - On 201 Created: automatically authenticates the user, hydrates Redux state, and redirects to `/dashboard`.

### Session Hydration & Route Protection
- On initial page load, `App.jsx` checks for an existing token in storage:
  - If a token exists: triggers `useGetMeQuery()` to verify session authenticity against `GET /api/auth/me`.
  - If token is valid: updates user profile and marks session initialized.
  - If token returns HTTP 401 (expired/invalid): automatically calls `logout()`, clears storage, and redirects to `/login`.
  - While verification is in flight, `<LoadingSpinner fullScreen />` prevents protected content flash.
- `<ProtectedRoute>` prevents unauthorized access to app pages.
- `<PublicRoute>` prevents already authenticated users from accessing `/login` and `/register`.

---

## 5. Security Architecture & Token Storage

| Storage Mechanism | Pros | Security Considerations & Mitigations |
| :--- | :--- | :--- |
| **`localStorage` (Current)** | Simple integration for single-page applications without custom backend cookie sessions. | Vulnerable to cross-site scripting (XSS). Mitigated by strict React input escaping, Zod schema sanitization, and avoiding `dangerouslySetInnerHTML`. |
| **`HttpOnly` Cookie (Enterprise Recommended)** | JavaScript cannot access tokens, providing protection against XSS token exfiltration. | Requires backend cookie configuration (`SameSite=Strict`, `Secure=true`) and CSRF protection headers (`X-CSRF-Token`). |

---

## 6. Build & Verification Commands

```powershell
# Build frontend for production
npm --prefix frontend run build

# Run backend unit and integration test suites
npm --prefix backend test
```
