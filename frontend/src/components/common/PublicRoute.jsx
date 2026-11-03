import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import { selectIsAuthenticated, selectAuthInitialized } from '../../features/auth/authSlice';
import { LoadingSpinner } from '../feedback/LoadingSpinner';

/**
 * PublicRoute Component
 * Wraps unauthenticated pages (e.g. /login, /register).
 * Redirects already-authenticated users to /dashboard.
 */
export const PublicRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isInitialized = useAppSelector(selectAuthInitialized);

  if (!isInitialized) {
    return <LoadingSpinner fullScreen size="lg" message="Loading..." />;
  }

  if (isAuthenticated) {
    const destination = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={destination} replace />;
  }

  return children ? children : <Outlet />;
};

export default PublicRoute;

