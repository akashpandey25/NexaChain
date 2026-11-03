import { baseApi } from '../../app/api/baseApi';

/**
 * Return on Investment (ROI) RTK Query API Module
 * Endpoints:
 * - GET /roi/history
 * - GET /roi/summary
 */
export const roiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoiHistory: builder.query({
      query: (params = {}) => ({
        url: '/roi/history',
        params
      }),
      providesTags: ['ROI'],
      transformResponse: (response) => response?.data || { roiRecords: [], pagination: {} }
    }),

    getRoiSummary: builder.query({
      query: () => '/roi/summary',
      providesTags: ['ROI'],
      transformResponse: (response) => response?.data?.summary || {}
    })
  })
});

export const {
  useGetRoiHistoryQuery,
  useLazyGetRoiHistoryQuery,
  useGetRoiSummaryQuery
} = roiApi;
