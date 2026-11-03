import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Base RTK Query API
 * 
 * Provides centralized network configuration, authentication token attachment,
 * base URL resolution, and unified cache tag definitions across all feature endpoints.
 */

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.replace(/\/+$/, '');
  }
  return 'http://localhost:5000/api';
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getApiBaseUrl(),
  prepareHeaders: (headers, { getState }) => {
    // Inject Authorization header if JWT token exists in Redux auth state
    const token = getState()?.auth?.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Accept', 'application/json');
    return headers;
  }
});

/**
 * Custom baseQuery wrapper that normalizes network errors and response envelopes.
 */
const dynamicBaseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error) {
    // Standardize error payload matching the backend error handler
    const backendMessage =
      result.error.data?.message ||
      result.error.data?.errors?.[0]?.message ||
      result.error.error ||
      'An unexpected error occurred while communicating with the server.';

    return {
      error: {
        status: result.error.status,
        message: backendMessage,
        data: result.error.data || null
      }
    };
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: dynamicBaseQuery,
  tagTypes: ['Auth', 'Dashboard', 'Investment', 'Referral', 'ROI', 'Wallet'],
  endpoints: () => ({})
});
