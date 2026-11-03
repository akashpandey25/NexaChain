import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { useAppDispatch, useAppSelector } from './app/store';
import { selectCurrentToken, selectAuthInitialized, setInitialized } from './features/auth/authSlice';
import { useGetMeQuery } from './features/auth/authApi';
import { LoadingSpinner } from './components/feedback/LoadingSpinner';

export default function App() {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectCurrentToken);
  const isInitialized = useAppSelector(selectAuthInitialized);

  // If a token is stored, verify session and hydrate profile
  const { isLoading } = useGetMeQuery(undefined, {
    skip: !token
  });

  useEffect(() => {
    if (!token) {
      dispatch(setInitialized());
    }
  }, [token, dispatch]);

  if (!isInitialized && isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Initializing NexaChain session..." />
      </div>
    );
  }

  return <RouterProvider router={router} />;
}
