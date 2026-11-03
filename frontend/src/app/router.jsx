import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';

// Guard components
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { PublicRoute } from '../components/common/PublicRoute';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';

// Route-level code splitting using React.lazy
const LoginPage = lazy(() =>
  import('../pages/auth/LoginPage').then((m) => ({ default: m.LoginPage || m.default }))
);
const RegisterPage = lazy(() =>
  import('../pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage || m.default }))
);
const DashboardPage = lazy(() =>
  import('../pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage || m.default }))
);
const InvestmentsPage = lazy(() =>
  import('../pages/investments/InvestmentsPage').then((m) => ({ default: m.InvestmentsPage || m.default }))
);
const InvestmentDetailPage = lazy(() =>
  import('../pages/investments/InvestmentDetailPage').then((m) => ({ default: m.InvestmentDetailPage || m.default }))
);
const ReferralsPage = lazy(() =>
  import('../pages/referrals/ReferralsPage').then((m) => ({ default: m.ReferralsPage || m.default }))
);
const RoiHistoryPage = lazy(() =>
  import('../pages/roi/RoiHistoryPage').then((m) => ({ default: m.RoiHistoryPage || m.default }))
);
const ProfilePage = lazy(() =>
  import('../pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage || m.default }))
);
const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage || m.default }))
);

const RouteSuspense = ({ children }) => (
  <Suspense
    fallback={
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading view..." />
      </div>
    }
  >
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  // Public auth routes (restricted if already logged in)
  {
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      {
        path: '/login',
        element: (
          <RouteSuspense>
            <LoginPage />
          </RouteSuspense>
        )
      },
      {
        path: '/register',
        element: (
          <RouteSuspense>
            <RegisterPage />
          </RouteSuspense>
        )
      }
    ]
  },

  // Protected application routes
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/',
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: '/dashboard',
        element: (
          <RouteSuspense>
            <DashboardPage />
          </RouteSuspense>
        )
      },
      {
        path: '/investments',
        element: (
          <RouteSuspense>
            <InvestmentsPage />
          </RouteSuspense>
        )
      },
      {
        path: '/investments/:id',
        element: (
          <RouteSuspense>
            <InvestmentDetailPage />
          </RouteSuspense>
        )
      },
      {
        path: '/referrals',
        element: (
          <RouteSuspense>
            <ReferralsPage />
          </RouteSuspense>
        )
      },
      {
        path: '/roi-history',
        element: (
          <RouteSuspense>
            <RoiHistoryPage />
          </RouteSuspense>
        )
      },
      {
        path: '/profile',
        element: (
          <RouteSuspense>
            <ProfilePage />
          </RouteSuspense>
        )
      }
    ]
  },

  // Catch-all 404
  {
    path: '*',
    element: (
      <RouteSuspense>
        <NotFoundPage />
      </RouteSuspense>
    )
  }
]);
