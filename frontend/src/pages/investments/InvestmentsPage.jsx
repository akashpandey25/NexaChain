import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';
import { EmptyState } from '../../components/feedback/EmptyState';
import {
  useGetInvestmentsQuery
} from '../../features/investments/investmentApi';
import { useGetDashboardDataQuery } from '../../features/dashboard/dashboardApi';
import { InvestmentsOverview } from '../../features/investments/components/InvestmentsOverview';
import { InvestmentsFilterBar } from '../../features/investments/components/InvestmentsFilterBar';
import { InvestmentsTable } from '../../features/investments/components/InvestmentsTable';
import { InvestmentsCardList } from '../../features/investments/components/InvestmentsCardList';
import { InvestmentsPagination } from '../../features/investments/components/InvestmentsPagination';
import { InvestmentsSkeleton } from '../../features/investments/components/InvestmentsSkeleton';
import { PiggyBank, RefreshCw } from 'lucide-react';

/**
 * Investments Management Page
 * Displays user portfolio overview, server-filtered listing, and pagination.
 */
export const InvestmentsPage = () => {
  // Query parameters state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState('all');

  // Build validated query arguments
  const queryParams = {
    page,
    limit,
    ...(status !== 'all' ? { status } : {})
  };

  // 1. Fetch paginated investments
  const {
    data: investmentsData,
    isLoading: isInvestmentsLoading,
    isFetching: isInvestmentsFetching,
    error: investmentsError,
    refetch: refetchInvestments
  } = useGetInvestmentsQuery(queryParams);

  // 2. Fetch authoritative portfolio overview from dashboard aggregation
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    refetch: refetchDashboard
  } = useGetDashboardDataQuery();

  const investments = investmentsData?.investments || [];
  const pagination = investmentsData?.pagination || {};

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1); // Reset to page 1 on filter change
  };

  const handlePageSizeChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleResetFilters = () => {
    setStatus('all');
    setPage(1);
  };

  const handleRefreshAll = () => {
    refetchInvestments();
    refetchDashboard();
  };

  const isInitialLoading = isInvestmentsLoading && !investmentsData;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Investment Portfolio"
        subtitle="Manage your capital allocations, monitor package performance, and inspect daily ROI contracts"
        actions={
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isInvestmentsFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh portfolio data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isInvestmentsFetching ? 'animate-spin text-emerald-400' : ''}`}
            />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Portfolio Overview KPI Cards */}
      <InvestmentsOverview
        summary={dashboardData?.summary}
        investmentsMeta={dashboardData?.investments}
        isLoading={isDashboardLoading && !dashboardData}
      />

      {/* Filter and Page Size Controls */}
      <InvestmentsFilterBar
        status={status}
        onStatusChange={handleStatusChange}
        pageSize={limit}
        onPageSizeChange={handlePageSizeChange}
        onReset={handleResetFilters}
        counts={dashboardData?.investments}
        isFetching={isInvestmentsFetching}
      />

      {/* Content Area */}
      {isInitialLoading ? (
        <InvestmentsSkeleton />
      ) : investmentsError ? (
        <ErrorMessage
          title="Could Not Load Investments"
          message={
            investmentsError?.data?.message ||
            investmentsError?.message ||
            'An unexpected error occurred while fetching investment packages.'
          }
          errors={investmentsError?.data?.errors}
          onRetry={refetchInvestments}
        />
      ) : investments.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8">
          <EmptyState
            icon={PiggyBank}
            title={
              status !== 'all'
                ? `No ${status.toUpperCase()} Investments Found`
                : 'No Investment Packages Yet'
            }
            description={
              status !== 'all'
                ? `There are currently no investment contracts with status "${status}". Try clearing the filter to see all packages.`
                : 'You do not have any registered investment packages yet. Once active, your contracts will accrue automated daily ROI returns here.'
            }
            actionText={status !== 'all' ? 'Clear Status Filter' : undefined}
            onAction={status !== 'all' ? handleResetFilters : undefined}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <InvestmentsTable investments={investments} />
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            <InvestmentsCardList investments={investments} />
          </div>

          {/* Accessible Pagination */}
          <InvestmentsPagination
            pagination={pagination}
            onPageChange={setPage}
            disabled={isInvestmentsFetching}
          />
        </div>
      )}
    </div>
  );
};

export default InvestmentsPage;
