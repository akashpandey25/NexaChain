import { baseApi } from '../../app/api/baseApi';
import { setCredentials, logout } from './authSlice';

/**
 * Authentication RTK Query API Module
 * Endpoints:
 * - POST /auth/register
 * - POST /auth/login
 * - GET  /auth/me
 */
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (credentials) => ({
        url: '/auth/register',
        method: 'POST',
        body: credentials
      }),
      invalidatesTags: ['Auth'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.data?.token && data?.data?.user) {
            dispatch(setCredentials({ user: data.data.user, token: data.data.token }));
          }
        } catch (err) {
          // Handled by component caller
        }
      }
    }),

    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials
      }),
      invalidatesTags: ['Auth', 'Dashboard', 'Investment', 'Referral', 'ROI'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.data?.token && data?.data?.user) {
            dispatch(setCredentials({ user: data.data.user, token: data.data.token }));
          }
        } catch (err) {
          // Handled by component caller
        }
      }
    }),

    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['Auth'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.data?.user) {
            dispatch(setCredentials({ user: data.data.user }));
          }
        } catch (err) {
          // If session verification fails (e.g. token expired/invalid), trigger logout
          if (err?.error?.status === 401) {
            dispatch(logout());
          }
        }
      }
    })
  })
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGetMeQuery,
  useLazyGetMeQuery
} = authApi;
