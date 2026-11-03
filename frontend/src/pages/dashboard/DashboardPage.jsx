import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Wallet,
  PiggyBank,
  Coins,
  Users,
  RefreshCw,
  Plus,
  ArrowRight
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { AppButton } from '../../components/common/AppButton';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';
import { useGetDashboardDataQuery } from '../../features/dashboard/dashboardApi';
import { StatCard } from '../../features/dashboard/components/StatCard';
import { RecentActivitySection } from '../../features/dashboard/components/RecentActivitySection';
import { DashboardSkeleton } from '../../features/dashboard/components/DashboardSkeleton';
import { formatPaiseToINR } from '../../utils/formatters';

// Lazy-load heavier Recharts visualization components to optimize initial bundle
const RoiHistoryChart = React.lazy(() => import('../../features/dashboard/components/RoiHistoryChart'));
const InvestmentDistributionChart = React.lazy(() => import('../../features/dashboard/components/InvestmentDistributionChart'));

const ChartLoadingFallback = () => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-80 flex flex-col justify-between animate-pulse">
    <div className="h-4 w-36 bg-slate-800 rounded" />
    <div className="h-56 bg-slate-950/60 rounded-xl" />
  </div>
);

/**
 * DashboardPage Component
 * 
 * Comprehensive data-driven dashboard integrating all metrics from GET /api/dashboard:
 * 1. KPI Metric Overview Cards (Total, Active, ROI Yield, Wallet)
 * 2. Secondary Referral Income & Team Metrics
 * 3. Lazy-Loaded Recharts Visualizations (ROI Yield Over Time & Portfolio Allocation)
 * 4. Recent Activity Log (Verified ROI Transactions, Investments, and Daily Summary)
 */
export const DashboardPage = () => {
  const { data, isLoading, isFetching, error, refetch } = useGetDashboardDataQuery();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Portfolio Dashboard"
          subtitle="Overview of your NexaChain investments"
        />
        <ErrorMessage
          title="Could not load dashboard statistics"
          message={error.message || 'Unable to communicate with the analytics engine.'}
          onRetry={refetch}
        />
      </div>
    );
  }

  // Extract structured data from backend payload
  const summary = data?.summary || {};
  const investments = data?.investments || {};
  const roi = data?.roi || {};
  const referrals = data?.referrals || {};

  return (
    <div className="space-y-8">
      {/* 1. Page Header with Action Controls */}
      <PageHeader
        title="Portfolio Overview"
        subtitle="Live performance, capital allocation, and automated daily yields"
        action={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={refetch}
              disabled={isFetching}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors disabled:opacity-50"
              title="Refresh dashboard metrics"
              aria-label="Refresh dashboard data"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <Link to="/investments">
              <AppButton variant="primary" size="md">
                <Plus className="w-4 h-4 mr-1.5" />
                New Investment
              </AppButton>
            </Link>
          </div>
        }
      />

      {/* 2. Primary Financial KPI Cards Grid (Assessment Specified Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Total Investments */}
        <StatCard
          title="Total Investments"
          amountPaise={summary.totalInvestmentPaise}
          count={investments.totalCount}
          countLabel="packages"
          icon={PiggyBank}
          variant="default"
          badgeText={investments.activeCount ? `${investments.activeCount} active` : undefined}
        />

        {/* 2. Daily ROI */}
        <StatCard
          title="Daily ROI"
          amountPaise={summary.totalRoiPaise}
          count={roi.processedRecordCount}
          countLabel="distributions"
          icon={Coins}
          variant="emerald"
        />

        {/* 3. Total Level Income */}
        <StatCard
          title="Total Level Income"
          amountPaise={summary.processedReferralIncomePaise}
          count={summary.totalDirectReferrals}
          countLabel="referrals"
          icon={Users}
          variant="purple"
          badgeText={`${summary.activeDirectReferrals || 0} active`}
        />

        {/* 4. Wallet Balance */}
        <StatCard
          title="Wallet Balance"
          amountPaise={summary.walletBalancePaise}
          subtitle="Available for reinvestment"
          icon={Wallet}
          variant="cyan"
          badgeText="Active"
        />
      </div>

      {/* 3. Secondary Portfolio & Network Summary Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-emerald-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
                Active Capital Allocation
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                {investments.activeCount || 0} Active Plans
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live principal actively earning daily ROI distributions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
          <div>
            <span className="text-[11px] text-slate-400 block">Active Principal</span>
            <span className="text-base sm:text-lg font-bold text-emerald-400">
              {formatPaiseToINR(summary.activeInvestmentPaise)}
            </span>
          </div>

          <div className="pl-6 border-l border-slate-800">
            <span className="text-[11px] text-slate-400 block">Direct Affiliates</span>
            <span className="text-base sm:text-lg font-bold text-white">
              {summary.totalDirectReferrals || 0}{' '}
              <span className="text-xs font-normal text-slate-400">
                ({summary.activeDirectReferrals || 0} active)
              </span>
            </span>
          </div>

          <Link
            to="/investments"
            className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
            title="View investments"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 4. Lazy-Loaded Charts & Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Historical ROI Line/Area Chart */}
        <Suspense fallback={<ChartLoadingFallback />}>
          <RoiHistoryChart chartData={roi.chartData} />
        </Suspense>

        {/* Right: Investment Allocation Donut Chart */}
        <Suspense fallback={<ChartLoadingFallback />}>
          <InvestmentDistributionChart
            amountByStatus={investments.amountByStatus}
            totalCount={investments.totalCount}
          />
        </Suspense>
      </div>

      {/* 5. Recent Activity Section */}
      <RecentActivitySection roiChartData={roi.chartData} />

      {/* 6. Quick Action Links Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/investments"
          className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-slate-900 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
              Manage Investments
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-[11px] text-slate-400">
            Allocate capital into automated daily ROI packages.
          </p>
        </Link>

        <Link
          to="/roi-history"
          className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-slate-900 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
              Daily ROI Ledger
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-[11px] text-slate-400">
            Inspect individual daily midnight distribution payouts.
          </p>
        </Link>

        <Link
          to="/referrals"
          className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-slate-900 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
              Referral Program
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-[11px] text-slate-400">
            Invite partners using your code and track commission downlines.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
