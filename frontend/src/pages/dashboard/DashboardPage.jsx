import React, { Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  TrendingUp,
  Wallet,
  PiggyBank,
  Coins,
  ArrowRight,
  Share2,
  Copy,
  Check,
  RefreshCw,
  FolderKanban,
  FileSpreadsheet,
  Users2
} from 'lucide-react';
import { useGetDashboardDataQuery } from '../../features/dashboard/dashboardApi';
import { StatCard } from '../../features/dashboard/components/StatCard';
import { RecentActivitySection } from '../../features/dashboard/components/RecentActivitySection';
import { DashboardSkeleton } from '../../features/dashboard/components/DashboardSkeleton';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';
import { formatPaiseToINR } from '../../utils/formatters';

// Lazy-load Recharts visualization components to optimize initial bundle
const RoiHistoryChart = React.lazy(() => import('../../features/dashboard/components/RoiHistoryChart'));
const InvestmentDistributionChart = React.lazy(() => import('../../features/dashboard/components/InvestmentDistributionChart'));

const ChartLoadingFallback = () => (
  <div className="bg-surface-card border border-border-subtle rounded-card p-6 h-80 flex flex-col justify-between animate-pulse">
    <div className="h-4 w-36 bg-surface-elevated rounded" />
    <div className="h-56 bg-surface-elevated/40 rounded-card" />
  </div>
);

/**
 * DashboardPage Component
 * 
 * Institutional fintech financial overview maintaining 100% of the live backend
 * financial calculations and API contracts:
 * 1. Status Badges: CRON ENGINE: ACTIVE (00:00 IST) & Integer Paise Precision
 * 2. Header & Action controls: Refresh Data, View Investments
 * 3. 4 Primary KPI StatCards (Total Invested, Active Principal, Total ROI Yield, Available Balance)
 * 4. Multi-Level Referral Network Banner with live link copy and downline trigger
 * 5. Visualizations Grid (ROI History & Lifecycle Allocation Donut)
 * 6. Recent Activity & History Table with StatusBadge and detail navigation
 * 7. Bottom Navigation Cards (Manage Investments, Daily ROI Ledger, Referral Program)
 */
export const DashboardPage = () => {
  const { data, isLoading, isFetching, error, refetch } = useGetDashboardDataQuery();
  const authUser = useSelector((state) => state.auth?.user);
  const [copied, setCopied] = useState(false);

  const referralCode = authUser?.referralCode || '';

  const handleCopyLink = () => {
    if (!referralCode) return;
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Portfolio Overview</h1>
        </div>
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

  return (
    <div className="space-y-6">
      {/* 1. Dashboard Top Header Bar with Badges and Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          {/* Status Badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-semantic-positive/10 text-semantic-positive border border-semantic-positive/30">
              <span className="w-1.5 h-1.5 rounded-full bg-semantic-positive" />
              CRON ENGINE: ACTIVE (00:00 IST)
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-surface-elevated text-text-muted border border-border-subtle">
              Integer Paise Precision
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Portfolio Overview
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-2xl">
            Account performance, active contracts, and daily settlement schedule.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-button bg-surface-card hover:bg-surface-elevated text-text-primary text-xs font-semibold border border-border-subtle hover:border-border-strong transition-colors shadow-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus"
            title="Refresh Portfolio Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-semantic-positive' : ''}`} />
            <span>Refresh Data</span>
          </button>

          <Link
            to="/investments"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-button bg-semantic-positive hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus"
          >
            <span>View Investments</span>
          </Link>
        </div>
      </div>

      {/* 2. Primary 4 Financial KPI StatCards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Invested */}
        <StatCard
          title="TOTAL INVESTED"
          amountPaise={summary.totalInvestmentPaise ?? 0}
          icon={PiggyBank}
          variant="default"
          subtitle={investments.activeCount ? `${investments.activeCount} active packages` : undefined}
          footerLeft="Total contracts"
          footerRight={`${investments.totalCount ?? 0} packages`}
        />

        {/* 2. Active Principal */}
        <StatCard
          title="ACTIVE PRINCIPAL"
          amountPaise={summary.activeInvestmentPaise ?? 0}
          icon={TrendingUp}
          variant={summary.activeInvestmentPaise > 0 ? 'emerald' : 'default'}
          subBadges={
            investments.activeCount > 0
              ? [{ text: 'Active & Earning', variant: 'emerald' }]
              : []
          }
          footerLeft="Locked capital"
          footerRight={`${investments.activeCount ?? 0} active packages`}
        />

        {/* 3. Total ROI Yield */}
        <StatCard
          title="TOTAL ROI YIELD"
          amountPaise={summary.totalRoiPaise ?? summary.dailyRoiPaise ?? 0}
          icon={Coins}
          variant={summary.totalRoiPaise > 0 ? 'emerald' : 'default'}
          subtitle={
            summary.dailyRoiPaise > 0
              ? `Today: ${formatPaiseToINR(summary.dailyRoiPaise)} / day`
              : 'Cumulative distributions'
          }
          footerLeft="Total distributions"
          footerRight={`${roi.dailyRoiRecordCount || roi.processedRecordCount || 0} cycles executed`}
        />

        {/* 4. Available Balance */}
        <StatCard
          title="AVAILABLE BALANCE"
          amountPaise={summary.walletBalancePaise ?? 0}
          icon={Wallet}
          variant="default"
          subtitle="Unallocated wallet balance"
          footerLeft="Verified balance"
          footerRight="Ready to deploy"
        />
      </div>

      {/* 3. Multi-Level Referral Network Summary Banner */}
      <div className="bg-surface-card border border-border-subtle rounded-card p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-5 border-b border-border-subtle">
          {/* Left info */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-card bg-surface-elevated border border-border-subtle flex items-center justify-center text-text-secondary shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-semibold text-text-primary tracking-tight">
                  Multi-Level Referral Network
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-surface-elevated text-text-muted border border-border-subtle">
                  Affiliate Downline (Commissions Inactive by Policy)
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Direct and tier-level sponsored network tracking with cycle-safe downline tree visualization.
              </p>
            </div>
          </div>

          {/* Right stats columns */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-8 justify-between lg:justify-end">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block mb-1">
                COMMISSION EARNED
              </span>
              <span className="text-xl sm:text-2xl font-bold font-sans font-tabular tabular-nums text-text-primary">
                {formatPaiseToINR(summary.processedReferralIncomePaise ?? 0)}
              </span>
            </div>

            <div className="pl-4 sm:pl-6 border-l border-border-subtle">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block mb-1">
                DIRECT AFFILIATES
              </span>
              <div className="text-xl sm:text-2xl font-bold font-sans font-tabular tabular-nums text-text-primary flex items-baseline gap-1.5">
                <span>{summary.totalDirectReferrals ?? 0}</span>
                <span className="text-xs font-normal text-text-muted">
                  ({summary.activeDirectReferrals ?? 0} active)
                </span>
              </div>
            </div>

            <div className="pl-4 sm:pl-6 border-l border-border-subtle hidden sm:block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block mb-1">
                NETWORK DEPTH
              </span>
              <span className="text-sm sm:text-base font-semibold text-text-primary">
                Multi-Tier Tree
              </span>
            </div>
          </div>
        </div>

        {/* Bottom row: Referral Link and Action buttons */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-text-secondary flex-wrap min-w-0">
            <Share2 className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="text-text-muted shrink-0">Your Referral Link:</span>
            {referralCode ? (
              <code className="text-text-primary font-mono bg-surface-canvas px-2.5 py-1 rounded border border-border-subtle text-[11px] select-all truncate max-w-full inline-block">
                {typeof window !== 'undefined' ? `${window.location.host}/register?ref=${referralCode}` : `ref=${referralCode}`}
              </code>
            ) : (
              <span className="text-text-muted italic text-[11px]">Active on account</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {referralCode && (
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-surface-elevated hover:bg-surface-card-hover border border-border-subtle text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-semantic-focus"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-semantic-positive" />
                    <span className="text-semantic-positive font-medium">Copied Link!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-text-muted" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            )}

            <Link
              to="/referrals"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-surface-elevated hover:bg-surface-card-hover border border-border-subtle text-text-primary font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-semantic-focus"
            >
              <span>Downline Network</span>
              <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Visualizations Grid (ROI History & Allocation Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: ROI Yield History & Growth */}
        <Suspense fallback={<ChartLoadingFallback />}>
          <RoiHistoryChart chartData={roi.chartData} />
        </Suspense>

        {/* Right: Portfolio Allocation */}
        <Suspense fallback={<ChartLoadingFallback />}>
          <InvestmentDistributionChart
            amountByStatus={investments.amountByStatus}
            totalCount={investments.totalCount}
          />
        </Suspense>
      </div>

      {/* 5. Recent Activity & History Table */}
      <RecentActivitySection roiChartData={roi.chartData} />

      {/* 6. Bottom 3 Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <Link
          to="/investments"
          className="group block p-4 bg-surface-card border border-border-subtle hover:border-border-strong hover:bg-surface-card-hover rounded-card transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus"
        >
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span className="font-semibold text-text-primary group-hover:text-semantic-positive transition-colors flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-semantic-positive" />
              Manage Investments
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-semantic-positive group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-[11px] text-text-muted ml-6">
            Explore active packages and tiers
          </p>
        </Link>

        <Link
          to="/roi-history"
          className="group block p-4 bg-surface-card border border-border-subtle hover:border-border-strong hover:bg-surface-card-hover rounded-card transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus"
        >
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span className="font-semibold text-text-primary group-hover:text-semantic-positive transition-colors flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-text-secondary" />
              Daily ROI Ledger
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-semantic-positive group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-[11px] text-text-muted ml-6">
            Inspect midnight distribution payouts
          </p>
        </Link>

        <Link
          to="/referrals"
          className="group block p-4 bg-surface-card border border-border-subtle hover:border-border-strong hover:bg-surface-card-hover rounded-card transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus"
        >
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span className="font-semibold text-text-primary group-hover:text-semantic-positive transition-colors flex items-center gap-2">
              <Users2 className="w-4 h-4 text-text-secondary" />
              Referral Program
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-semantic-positive group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-[11px] text-text-muted ml-6">
            Track multi-level commission trees
          </p>
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
