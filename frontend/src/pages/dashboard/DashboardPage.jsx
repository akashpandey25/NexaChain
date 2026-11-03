import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Wallet,
  PiggyBank,
  Coins,
  Users,
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { AppButton } from '../../components/common/AppButton';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';
import { useGetDashboardDataQuery } from '../../features/dashboard/dashboardApi';
import { StatCard } from '../../features/dashboard/components/StatCard';
import { RoiHistoryChart } from '../../features/dashboard/components/RoiHistoryChart';
import { InvestmentDistributionChart } from '../../features/dashboard/components/InvestmentDistributionChart';
import { RecentActivitySection } from '../../features/dashboard/components/RecentActivitySection';
import { DashboardSkeleton } from '../../features/dashboard/components/DashboardSkeleton';
import { formatPaiseToINR } from '../../utils/formatters';

/**
 * DashboardPage Component
 * 
 * Comprehensive data-driven dashboard integrating all metrics from GET /api/dashboard:
 * 1. KPI Metric Overview Cards (Total, Active, ROI Yield, Wallet)
 * 2. Secondary Referral Income & Team Metrics
 * 3. Recharts Visualizations: ROI Yield Over Time & Portfolio Allocation by Status
 * 4. Recent Activity Log (Recent ROI Distributions & Investments)
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

      {/* 2. Primary Financial KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Invested */}
        <StatCard
          title="Total Invested"
          amountPaise={summary.totalInvestmentPaise}
          count={investments.totalCount}
          countLabel="total packages"
          icon={PiggyBank}
          variant="default"
        />

        {/* Active Principal */}
        <StatCard
          title="Active Principal"
          amountPaise={summary.activeInvestmentPaise}
          count={investments.activeCount}
          countLabel="active packages"
          icon={TrendingUp}
          variant="emerald"
        />

        {/* Total ROI Yield */}
        <StatCard
          title="Total ROI Yield"
          amountPaise={summary.totalRoiPaise}
          count={roi.processedRecordCount}
          countLabel="distributions"
          icon={Coins}
          variant="emerald"
        />

        {/* Available Wallet Balance */}
        <StatCard
          title="Available Balance"
          amountPaise={summary.walletBalancePaise}
          subtitle="Ready for reinvestment"
          icon={Wallet}
          variant="cyan"
          badgeText="Active"
        />
      </div>

      {/* 3. Secondary Referral Metrics Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/40 flex items-center justify-center text-purple-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-purple-300">
                Multi-Level Referral Earnings
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950 text-purple-400 border border-purple-800/60">
                Tier Network
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Accumulated commissions earned from invited sponsor downlines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
          <div>
            <span className="text-[11px] text-slate-400 block">Commission Earned</span>
            <span className="text-base sm:text-lg font-bold text-purple-400">
              {formatPaiseToINR(summary.processedReferralIncomePaise)}
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
            to="/referrals"
            className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
            title="View referral network"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 4. Charts & Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Historical ROI Line/Area Chart */}
        <RoiHistoryChart chartData={roi.chartData} />

        {/* Right: Investment Allocation Donut Chart */}
        <InvestmentDistributionChart
          amountByStatus={investments.amountByStatus}
          totalCount={investments.totalCount}
        />
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
