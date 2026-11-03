import { baseApi } from '../../app/api/baseApi';

/**
 * Dashboard RTK Query API Module
 * Endpoints:
 * - GET /dashboard
 */
export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardData: builder.query({
      query: (params = {}) => ({
        url: '/dashboard',
        params
      }),
      providesTags: ['Dashboard'],
      transformResponse: (response) => response?.data || {}
    })
  })
});

export const { useGetDashboardDataQuery, useLazyGetDashboardDataQuery } = dashboardApi;

