import React from 'react';
import { Users, UserCheck, Wallet, GitFork } from 'lucide-react';
import { formatPaiseToINR, formatIndianNumber } from '../../../utils/formatters';

/**
 * Referral Overview Cards Component
 * Renders high-level referral performance metrics directly from the backend.
 * 
 * @param {object} props
 * @param {object} props.referralsMeta Referral statistics from dashboard API
 * @param {object} props.incomeSummary Income summary from referral income API
 * @param {number} [props.networkSize] Total members in referral tree
 * @param {boolean} [props.isLoading] Loading state
 */
export const ReferralOverview = ({
  referralsMeta = {},
  incomeSummary = {},
  networkSize = 0,
  isLoading = false
}) => {
  const totalDirect = referralsMeta?.totalDirectReferrals ?? 0;
  const activeDirect = referralsMeta?.activeDirectReferrals ?? 0;
  const processedIncomePaise =
    referralsMeta?.processedReferralIncomePaise ??
    incomeSummary?.processedIncomePaise ??
    0;
  const pendingIncomePaise = incomeSummary?.pendingIncomePaise ?? 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 bg-slate-900/60 border border-slate-800 rounded-xl p-5"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Direct Referrals */}
      <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Direct Referrals
          </span>
          <div className="p-2 bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 rounded-lg">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 text-2xl font-bold tracking-tight text-white">
          {formatIndianNumber(totalDirect)}
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Level 1 registered downlines
        </p>
      </div>

      {/* Card 2: Active Direct Referrals */}
      <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Affiliates
          </span>
          <div className="p-2 bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded-lg">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 text-2xl font-bold tracking-tight text-emerald-400">
          {formatIndianNumber(activeDirect)}
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Active contract participants
        </p>
      </div>

      {/* Card 3: Processed Referral Income */}
      <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Referral Income
          </span>
          <div className="p-2 bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded-lg">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 text-2xl font-bold tracking-tight text-white">
          {formatPaiseToINR(processedIncomePaise)}
        </div>
        <p className="mt-1 text-xs text-slate-400">
          {pendingIncomePaise > 0
            ? `+${formatPaiseToINR(pendingIncomePaise)} pending`
            : 'Credited directly to wallet'}
        </p>
      </div>

      {/* Card 4: Total Downline Network Size */}
      <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Downline Network
          </span>
          <div className="p-2 bg-purple-950/60 text-purple-400 border border-purple-800/40 rounded-lg">
            <GitFork className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 text-2xl font-bold tracking-tight text-purple-300">
          {formatIndianNumber(networkSize > 0 ? networkSize : totalDirect)}
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Multi-level tree members
        </p>
      </div>
    </div>
  );
};

export default ReferralOverview;
