import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useGetRoiHistoryQuery, useGetRoiSummaryQuery } from '../../features/roi/roiApi';
import { useGetDashboardDataQuery } from '../../features/dashboard/dashboardApi';
import { RoiOverviewCards } from '../../features/roi/components/RoiOverviewCards';
import { RoiAnalyticsChart } from '../../features/roi/components/RoiAnalyticsChart';
import { RoiFilterBar } from '../../features/roi/components/RoiFilterBar';
import { RoiHistoryTable } from '../../features/roi/components/RoiHistoryTable';
import { RoiHistoryCardList } from '../../features/roi/components/RoiHistoryCardList';
import { RoiPagination } from '../../features/roi/components/RoiPagination';
import { RoiSkeleton } from '../../features/roi/components/RoiSkeleton';
import { TrendingUp, RefreshCw, ShieldCheck } from 'lucide-react';

/**
 * Daily ROI History & Earnings Analytics Page
 * Displays aggregated return metrics, historical timeseries charts,
 * server-filtered transaction logs, and pagination.
 */
export const RoiHistoryPage = () => {
  // Query parameters state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Build validated query arguments (only send defined values matching backend schema)
  const queryParams = {
    page,
    limit,
    ...(status !== 'all' ? { status } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {})
  };

  // 1. Fetch paginated ROI history records
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    isFetching: isHistoryFetching,
    error: historyError,
    refetch: refetchHistory
  } = useGetRoiHistoryQuery(queryParams);

  // 2. Fetch authenticated user summary totals
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary
  } = useGetRoiSummaryQuery();

  // 3. Fetch dashboard timeseries chart data
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    refetch: refetchDashboard
  } = useGetDashboardDataQuery();

  const records = historyData?.roiRecords || [];
  const pagination = historyData?.pagination || {};
  const summary = summaryData || {};
  const chartData = dashboardData?.roi?.chartData || [];

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleDateChange = (field, value) => {
    if (field === 'startDate') setStartDate(value);
    if (field === 'endDate') setEndDate(value);
    setPage(1);
  };

  const handlePageSizeChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleResetFilters = () => {
    setStatus('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleRefreshAll = () => {
    refetchHistory();
    refetchSummary();
    refetchDashboard();
  };

  const isInitialLoading = isHistoryLoading && !historyData;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="ROI History & Analytics"
        subtitle="Audit automated daily return distributions, monitor yield performance, and track historical disbursements"
        actions={
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isHistoryFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium bg-surface-card border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors disabled:opacity-50"
            title="Refresh ROI records"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isHistoryFetching ? 'animate-spin text-brand-primary' : ''}`}
            />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Overview Cards */}
      <RoiOverviewCards
        summary={summary}
        isLoading={isSummaryLoading && !summaryData}
      />

      {/* Historical Yield Chart */}
      <RoiAnalyticsChart
        chartData={chartData}
        isLoading={isDashboardLoading && !dashboardData}
      />

      {/* Filter and Date Controls */}
      <RoiFilterBar
        status={status}
        onStatusChange={handleStatusChange}
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
        pageSize={limit}
        onPageSizeChange={handlePageSizeChange}
        onReset={handleResetFilters}
        isFetching={isHistoryFetching}
      />

      {/* Content Area */}
      {isInitialLoading ? (
        <RoiSkeleton />
      ) : historyError ? (
        <ErrorMessage
          title="Could Not Load ROI History"
          message={
            historyError?.data?.message ||
            historyError?.message ||
            'An error occurred while fetching ROI transaction records.'
          }
          errors={historyError?.data?.errors}
          onRetry={refetchHistory}
        />
      ) : records.length === 0 ? (
        <div className="bg-surface-card border border-border-subtle rounded-card p-8">
          <EmptyState
            icon={TrendingUp}
            title={
              status !== 'all' || startDate || endDate
                ? 'No ROI Records Found for Selected Filters'
                : 'No Daily ROI Distributions Yet'
            }
            description={
              status !== 'all' || startDate || endDate
                ? 'There are no ROI transactions matching your filter criteria. Try resetting the filters to view all historical records.'
                : 'Active investments accrue daily ROI yields automatically each night at 12:00 AM IST (Asia/Kolkata). Processed distributions will appear here once executed.'
            }
            actionText={
              status !== 'all' || startDate || endDate
                ? 'Clear Filters'
                : undefined
            }
            onAction={
              status !== 'all' || startDate || endDate
                ? handleResetFilters
                : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <RoiHistoryTable records={records} />
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            <RoiHistoryCardList records={records} />
          </div>

          {/* Accessible Pagination */}
          <RoiPagination
            pagination={pagination}
            onPageChange={setPage}
            disabled={isHistoryFetching}
          />
        </div>
      )}

      {/* Financial Governance Footer Note */}
      <div className="bg-surface-card border border-border-subtle rounded-card p-4.5 flex items-start gap-3 text-xs text-text-secondary">
        <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-text-primary">Automated Daily ROI Distribution Notice:</strong> Yield calculations are strictly computed and disbursed on the server at 12:00 AM IST (Asia/Kolkata) using verified business dates and configured plan parameters. Client-side tampering or rate modifications are cryptographically blocked.
        </p>
      </div>
    </div>
  );
};

export default RoiHistoryPage;
