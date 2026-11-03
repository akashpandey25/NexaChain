import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';

// Guard components
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { PublicRoute } from '../components/common/PublicRoute';

// Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { InvestmentsPage } from '../pages/investments/InvestmentsPage';
import { InvestmentDetailPage } from '../pages/investments/InvestmentDetailPage';
import { ReferralsPage } from '../pages/referrals/ReferralsPage';
import { RoiHistoryPage } from '../pages/roi/RoiHistoryPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { NotFoundPage } from '../pages/NotFoundPage';

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
        element: <LoginPage />
      },
      {
        path: '/register',
        element: <RegisterPage />
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
        element: <DashboardPage />
      },
      {
        path: '/investments',
        element: <InvestmentsPage />
      },
      {
        path: '/investments/:id',
        element: <InvestmentDetailPage />
      },
      {
        path: '/referrals',
        element: <ReferralsPage />
      },
      {
        path: '/roi-history',
        element: <RoiHistoryPage />
      },
      {
        path: '/profile',
        element: <ProfilePage />
      }
    ]
  },

  // Catch-all 404
  {
    path: '*',
    element: <NotFoundPage />
  }
]);
