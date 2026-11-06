import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import { selectCurrentUser, selectIsAuthenticated, selectAuthInitialized } from '../../features/auth/authSlice';
import { LoadingSpinner } from '../feedback/LoadingSpinner';

/**
 * AdminRoute Component
 * Guards administrative views against unauthenticated and non-admin access.
 * Non-admin authenticated users are redirected to /dashboard.
 */
export const AdminRoute = ({ children }) => {
  const location = useLocation();
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isInitialized = useAppSelector(selectAuthInitialized);

  if (!isInitialized) {
    return <LoadingSpinner fullScreen size="lg" message="Verifying administrative access..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};

export default AdminRoute;

