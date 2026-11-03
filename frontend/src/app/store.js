import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { useDispatch, useSelector } from 'react-redux';
import authReducer from '../features/auth/authSlice';
import { baseApi } from './api/baseApi';

/**
 * Central Redux Store Configuration
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Redux Toolkit RTK Query handles serializability internally
        ignoredActions: ['api/executeMutation/fulfilled', 'api/executeQuery/fulfilled']
      }
    }).concat(baseApi.middleware),
  devTools: import.meta.env.MODE !== 'production'
});

// Enable refetchOnFocus and refetchOnReconnect behaviors
setupListeners(store.dispatch);

/**
 * Convenient hooks matching standard Redux Toolkit conventions in JavaScript.
 */
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

