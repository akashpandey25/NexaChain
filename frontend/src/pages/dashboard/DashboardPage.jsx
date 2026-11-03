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
  PlusCircle,
  ArrowUpRight,
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

// Lazy-load heavier Recharts visualization components to optimize initial bundle
const RoiHistoryChart = React.lazy(() => import('../../features/dashboard/components/RoiHistoryChart'));
const InvestmentDistributionChart = React.lazy(() => import('../../features/dashboard/components/InvestmentDistributionChart'));

const ChartLoadingFallback = () => (
  <div className="bg-[#0b101b] border border-slate-800/90 rounded-2xl p-6 h-80 flex flex-col justify-between animate-pulse">
    <div className="h-4 w-36 bg-slate-800 rounded" />
    <div className="h-56 bg-slate-950/60 rounded-xl" />
  </div>
);

/**
 * DashboardPage Component
 * 
 * Recreates the exact dark fintech UI from the reference design while maintaining
 * 100% of the live backend financial calculations and API contracts:
 * 1. Status Badges: CRON ENGINE: ACTIVE (00:00 UTC) & Paise Precision v2.4
 * 2. Header & Action buttons: Deposit Funds, Withdrawal, Reinvest ROI
 * 3. 4 Primary KPI StatCards (Total Invested, Active Principal, Total ROI Yield, Available Balance)
 * 4. Multi-Level Referral Earnings Banner with live link copy and downline trigger
 * 5. Visualizations Grid (Glowing ROI Yield Line/Area & 100% Deployed Multi-tier Donut)
 * 6. Recent Activity & History Table with verified audit ledger pills
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Portfolio Overview</h1>
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              CRON ENGINE: ACTIVE (00:00 UTC)
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-900 text-slate-400 border border-slate-800">
              Paise Precision v2.4
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Portfolio Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Live capital performance, automated daily compounding yields, and tier distribution.
          </p>
        </div>

        {/* 3 Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <Link
            to="/investments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-slate-400" />
            <span>Deposit Funds</span>
          </Link>

          <Link
            to="/investments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-all shadow-sm"
          >
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
            <span>Withdrawal</span>
          </Link>

          <Link
            to="/investments"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Reinvest ROI</span>
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
          footerLeft="Active packages"
          footerRight={`${investments.totalCount ?? 0} contracts`}
        />

        {/* 2. Active Principal */}
        <StatCard
          title="ACTIVE PRINCIPAL"
          amountPaise={summary.activeInvestmentPaise ?? 0}
          icon={TrendingUp}
          variant="emerald"
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
          variant="cyan"
          subtitle={
            summary.dailyRoiPaise > 0
              ? `Daily run-rate: ${formatPaiseToINR(summary.dailyRoiPaise)} / day`
              : 'Cumulative ROI Earned'
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
          subBadges={
            summary.walletBalancePaise > 0
              ? [{ text: '• Ready for Reinvest', variant: 'emerald' }]
              : []
          }
          footerLeft="Unallocated capital"
          footerRight="Instant Liquidity"
        />
      </div>

      {/* 3. Multi-Level Referral Earnings Banner */}
      <div className="bg-[#0b101b] border border-slate-800/90 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-5 border-b border-slate-800/70">
          {/* Left info */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-950/70 border border-purple-800/50 flex items-center justify-center text-purple-400 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Multi-Level Referral Earnings
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800/60">
                  Tier Network (5% - 3% - 1%)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Accumulated perpetual commissions earned from direct and tier-level sponsored downlines.
              </p>
            </div>
          </div>

          {/* Right stats columns */}
          <div className="flex items-center gap-6 sm:gap-8 justify-between lg:justify-end">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                COMMISSION EARNED
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-cyan-400">
                {formatPaiseToINR(summary.processedReferralIncomePaise ?? 0)}
              </span>
            </div>

            <div className="pl-6 border-l border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                DIRECT AFFILIATES
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-white flex items-baseline gap-1.5">
                <span>{summary.totalDirectReferrals ?? 0}</span>
                <span className="text-xs font-normal text-slate-400">
                  ({summary.activeDirectReferrals ?? 0} active)
                </span>
              </div>
            </div>

            <div className="pl-6 border-l border-slate-800 hidden sm:block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                TIER DEPTH
              </span>
              <span className="text-sm sm:text-base font-bold text-white">
                3 Levels Active
              </span>
            </div>
          </div>
        </div>

        {/* Bottom row: Referral Link and Action buttons */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Share2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Your Referral Link:</span>
            {referralCode ? (
              <code className="text-emerald-400 font-mono bg-slate-900/80 px-2.5 py-0.5 rounded border border-slate-800">
                nexachain.io/ref/{referralCode}
              </code>
            ) : (
              <span className="text-slate-500 italic text-[11px]">Active on account</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {referralCode && (
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied Link!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            )}

            <Link
              to="/referrals"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
            >
              <span>Downline Network</span>
              <ArrowRight className="w-3.5 h-3.5" />
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
          className="group block p-4 bg-[#0b101b] border border-slate-800/90 rounded-xl hover:border-slate-700 hover:bg-slate-900/60 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-emerald-400" />
              Manage Investments
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-[11px] text-slate-400 ml-6">
            Explore active packages and tiers
          </p>
        </Link>

        <Link
          to="/roi-history"
          className="group block p-4 bg-[#0b101b] border border-slate-800/90 rounded-xl hover:border-slate-700 hover:bg-slate-900/60 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              Daily ROI Ledger
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-[11px] text-slate-400 ml-6">
            Inspect midnight distribution payouts
          </p>
        </Link>

        <Link
          to="/referrals"
          className="group block p-4 bg-[#0b101b] border border-slate-800/90 rounded-xl hover:border-slate-700 hover:bg-slate-900/60 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
              <Users2 className="w-4 h-4 text-purple-400" />
              Referral Program
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-[11px] text-slate-400 ml-6">
            Track multi-level commission trees
          </p>
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
