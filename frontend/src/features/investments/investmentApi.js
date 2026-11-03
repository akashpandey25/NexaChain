import { baseApi } from '../../app/api/baseApi';

/**
 * Investments RTK Query API Module
 * Endpoints:
 * - POST /investments
 * - GET  /investments
 * - GET  /investments/:id
 */
export const investmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
    })
  })
});

export const {
  useCreateInvestmentMutation,
  useGetInvestmentsQuery,
  useLazyGetInvestmentsQuery,
  useGetInvestmentByIdQuery
} = investmentApi;

