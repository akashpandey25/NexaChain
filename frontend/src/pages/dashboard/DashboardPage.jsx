import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { AppButton } from '../../components/common/AppButton';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';
import { useGetDashboardDataQuery } from '../../features/dashboard/dashboardApi';
import { TrendingUp, Users, Wallet, PiggyBank, ArrowRight, ShieldCheck } from 'lucide-react';

const formatPaise = (paise = 0) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(paise / 100);
};

export const DashboardPage = () => {
  const { data, isLoading, error, refetch } = useGetDashboardDataQuery();

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" message="Loading your dashboard portfolio..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Dashboard" subtitle="Overview of your NexaChain investments" />
        <ErrorMessage
          title="Could not load dashboard data"
          message={error.message}
          onRetry={refetch}
        />
      </div>
    );
  }

  const stats = data?.data || {};
  const totalInvestment = stats.totalInvestmentPaise || 0;
  const activeInvestment = stats.activeInvestmentPaise || 0;
  const totalRoiEarned = stats.totalRoiEarnedPaise || 0;
  const totalReferralIncome = stats.totalReferralIncomePaise || 0;
  const walletBalance = stats.walletBalancePaise || 0;
  const activeCount = stats.activeInvestmentsCount || 0;
  const referralCount = stats.directReferralsCount || 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Portfolio Overview"
        subtitle="Monitor daily ROI yields, investment cycles, and referral earnings"
        action={
          <Link to="/investments">
            <AppButton variant="primary" size="md">
              <PiggyBank className="w-4 h-4 mr-2" />
              New Investment
            </AppButton>
          </Link>
        }
      />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Investment */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Invested</span>
            <PiggyBank className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatPaise(totalInvestment)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">{activeCount} active</span> packages
          </div>
        </div>

        {/* Total ROI Earned */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total ROI Yield</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            {formatPaise(totalRoiEarned)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Active: {formatPaise(activeInvestment)}
          </div>
        </div>

        {/* Total Referral Income */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Referral Income</span>
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">
            {formatPaise(totalReferralIncome)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <span className="text-white font-medium">{referralCount}</span> direct partners
          </div>
        </div>

        {/* Available Wallet Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Wallet Balance</span>
            <Wallet className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 tracking-tight">
            {formatPaise(walletBalance)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ready for reinvestment</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/investments"
          className="group block p-6 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-indigo-500/50 hover:bg-slate-900 transition-all"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-white group-hover:text-indigo-400 transition-colors">
              Manage Investments
            </h4>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            View active packages, track ROI maturity dates, or create a new investment package.
          </p>
        </Link>

        <Link
          to="/roi-history"
          className="group block p-6 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-emerald-500/50 hover:bg-slate-900 transition-all"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors">
              Daily ROI History
            </h4>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Inspect daily automated ROI distribution records processed by the node-cron engine.
          </p>
        </Link>

        <Link
          to="/referrals"
          className="group block p-6 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-purple-500/50 hover:bg-slate-900 transition-all"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-white group-hover:text-purple-400 transition-colors">
              Referral Network & Tree
            </h4>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Explore your multi-level referral network, direct affiliates, and commission distributions.
          </p>
        </Link>
      </div>
    </div>
  );
};
