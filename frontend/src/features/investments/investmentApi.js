import { baseApi } from '../../app/api/baseApi';

/**
 * Investments RTK Query API Module
 * Endpoints:
 * - GET   /investments/plans
 * - POST  /investments
 * - GET   /investments
 * - GET   /investments/:id
 * - GET   /investments/admin/pending
 * - PATCH /investments/:id/activate
 * - PATCH /investments/:id/reject
 */
export const investmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvestmentPlans: builder.query({
      query: () => '/investments/plans',
      providesTags: ['InvestmentPlan'],
      transformResponse: (response) => response?.data?.plans || []
    }),

    createInvestment: builder.mutation({
      query: (investmentData) => ({
        url: '/investments',
        method: 'POST',
        body: investmentData
      }),
      invalidatesTags: ['Investment', 'Dashboard'],
      transformResponse: (response) => response?.data || {}
    }),

    getInvestments: builder.query({
      query: (params = {}) => ({
        url: '/investments',
        params
      }),
      providesTags: (result) =>
        result?.investments
          ? [
              ...result.investments.map(({ _id }) => ({ type: 'Investment', id: _id })),
              { type: 'Investment', id: 'LIST' }
            ]
          : [{ type: 'Investment', id: 'LIST' }],
      transformResponse: (response) => response?.data || { investments: [], pagination: {} }
    }),

    getInvestmentById: builder.query({
      query: (id) => `/investments/${id}`,
      providesTags: (result, error, id) => [{ type: 'Investment', id }],
      transformResponse: (response) => response?.data?.investment || null
    }),

    getAdminPendingInvestments: builder.query({
      query: (params = {}) => ({
        url: '/investments/admin/pending',
        params
      }),
      providesTags: [{ type: 'Investment', id: 'ADMIN_PENDING' }],
      transformResponse: (response) => response?.data || { investments: [], pagination: {} }
    }),

    activateInvestment: builder.mutation({
      query: (id) => ({
        url: `/investments/${id}/activate`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Investment', 'Dashboard', { type: 'Investment', id: 'ADMIN_PENDING' }]
    }),

    rejectInvestment: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/investments/${id}/reject`,
        method: 'PATCH',
        body: { reason }
      }),
      invalidatesTags: ['Investment', 'Dashboard', { type: 'Investment', id: 'ADMIN_PENDING' }]
    })
  })
});

export const {
  useGetInvestmentPlansQuery,
  useCreateInvestmentMutation,
  useGetInvestmentsQuery,
  useLazyGetInvestmentsQuery,
  useGetInvestmentByIdQuery,
  useGetAdminPendingInvestmentsQuery,
  useActivateInvestmentMutation,
  useRejectInvestmentMutation
} = investmentApi;

