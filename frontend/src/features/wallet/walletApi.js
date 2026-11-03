import { baseApi } from '../../app/api/baseApi';

/**
 * Wallet RTK Query API Module
 * Reserved for immutable ledger queries and wallet balance state.
 */
export const walletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWalletOverview: builder.query({
      query: () => '/dashboard',
      providesTags: ['Wallet', 'Dashboard'],
      transformResponse: (response) => ({
        walletBalancePaise: response?.data?.summary?.walletBalancePaise || 0,
        processedReferralIncomePaise: response?.data?.summary?.processedReferralIncomePaise || 0,
        totalRoiPaise: response?.data?.summary?.totalRoiPaise || 0
      })
    })
  })
});

export const { useGetWalletOverviewQuery } = walletApi;

