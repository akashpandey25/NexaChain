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
import { CreateInvestmentModal } from '../../features/investments/components/CreateInvestmentModal';
import {
  PiggyBank,
  RefreshCw,
  PlusCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';

/**
 * Investments Management Page
 * Displays user portfolio overview, server-filtered listing, and pagination.
 */
export const InvestmentsPage = () => {
  // Query parameters state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-sm transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Investment</span>
            </button>
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
          </div>
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
                : 'You do not have any registered investment packages yet. Submit an investment request below to initiate a contract.'
            }
            actionText={status !== 'all' ? 'Clear Status Filter' : 'Create Investment Request'}
            onAction={status !== 'all' ? handleResetFilters : () => setIsCreateModalOpen(true)}
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

      {/* Investment Lifecycle & Status Guide */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3.5">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Investment Lifecycle & Status Guide
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Pending */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Pending</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Request submitted and recorded. Awaiting administrative review. Zero yield accrues while pending.
            </p>
          </div>

          {/* Active */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Active</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Operational contract. Accrues automated daily yield dividends every midnight at 00:00 IST.
            </p>
          </div>

          {/* Completed */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-blue-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Contract has reached full calendar maturity. All daily yield distributions credited to available balance.
            </p>
          </div>

          {/* Cancelled */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-rose-400">
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancelled</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Request rejected or cancelled prior to contract execution. Rejection reason logged in audit history.
            </p>
          </div>
        </div>
      </div>

      {/* Create Investment Modal */}
      <CreateInvestmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default InvestmentsPage;
