import { baseApi } from '../../app/api/baseApi';

/**
 * Referrals RTK Query API Module
 * Endpoints:
 * - GET /referrals/direct
 * - GET /referrals/tree
 * - GET /referrals/income
 */
export const referralApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDirectReferrals: builder.query({
      query: (params = {}) => ({
        url: '/referrals/direct',
        params
      }),
      providesTags: ['Referral'],
      transformResponse: (response) => response?.data || { referrals: [], pagination: {} }
    }),

    getReferralTree: builder.query({
      query: (params = {}) => ({
        url: '/referrals/tree',
        params
      }),
      providesTags: ['Referral'],
      transformResponse: (response) => response?.data || { tree: null, metadata: {} }
    }),

    getReferralIncome: builder.query({
      query: (params = {}) => ({
        url: '/referrals/income',
        params
      }),
      providesTags: ['Referral'],
      transformResponse: (response) =>
        response?.data || {
          summary: {
            processedIncomePaise: 0,
            pendingIncomePaise: 0,
            failedIncomePaise: 0,
            totalIncomePaise: 0
          },
          incomeRecords: [],
          pagination: {}
        }
    })
  })
});

export const {
  useGetDirectReferralsQuery,
  useGetReferralTreeQuery,
  useGetReferralIncomeQuery,
  useLazyGetReferralIncomeQuery
} = referralApi;
