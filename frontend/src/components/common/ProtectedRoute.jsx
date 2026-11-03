import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import { selectIsAuthenticated, selectAuthInitialized } from '../../features/auth/authSlice';
import { LoadingSpinner } from '../feedback/LoadingSpinner';

/**
 * ProtectedRoute Component
 * Guards private routes against unauthenticated access.
 * Shows session loading spinner while verifying JWT credentials.
 */
export const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isInitialized = useAppSelector(selectAuthInitialized);

  if (!isInitialized) {
    return <LoadingSpinner fullScreen size="lg" message="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    // Redirect to login page while preserving intended destination in route state
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;

