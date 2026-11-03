import React from 'react';
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Layers
} from 'lucide-react';
import {
  formatPaiseToINR,
  formatIndianNumber
} from '../../../utils/formatters';

/**
 * Investments Overview Cards Component
 * Renders high-level investment metrics aggregated directly by the backend.
 * 
 * @param {object} props
 * @param {object} props.summary Backend summary object from dashboard API
 * @param {object} props.investmentsMeta Backend investments breakdown from dashboard API
 * @param {boolean} props.isLoading Loading state
 */
export const InvestmentsOverview = ({
  summary = {},
  investmentsMeta = {},
  isLoading = false
}) => {
  const totalCount = investmentsMeta?.totalCount ?? 0;
  const activeCount = investmentsMeta?.activeCount ?? 0;
  const pendingCount = investmentsMeta?.pendingCount ?? 0;
  const completedCount = investmentsMeta?.completedCount ?? 0;
  const cancelledCount = investmentsMeta?.cancelledCount ?? 0;

  const totalInvestmentPaise = summary?.totalInvestmentPaise ?? 0;
  const activeInvestmentPaise = summary?.activeInvestmentPaise ?? 0;

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
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Invested Principal */}
        <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Invested
            </span>
            <div className="p-2 bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-white">
            {formatPaiseToINR(totalInvestmentPaise)}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Cumulative principal allocated
          </p>
        </div>

        {/* Card 2: Active Working Capital */}
        <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Capital
            </span>
            <div className="p-2 bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-emerald-400">
            {formatPaiseToINR(activeInvestmentPaise)}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Currently generating daily ROI
          </p>
        </div>

        {/* Card 3: Total Contracts */}
        <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Packages
            </span>
            <div className="p-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-white">
            {formatIndianNumber(totalCount)}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {activeCount} active · {pendingCount} pending
          </p>
        </div>

        {/* Card 4: Active Contracts */}
        <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Contracts
            </span>
            <div className="p-2 bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-emerald-400">
            {formatIndianNumber(activeCount)}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {completedCount} completed · {cancelledCount} cancelled
          </p>
        </div>
      </div>

      {/* Status Breakdown Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
        <span className="font-medium text-slate-300">Portfolio Status:</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Active: {activeCount}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/40 text-amber-400 border border-amber-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Pending: {pendingCount}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-950/40 text-blue-400 border border-blue-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Completed: {completedCount}
        </span>
        {cancelledCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/40 text-rose-400 border border-rose-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Cancelled: {cancelledCount}
          </span>
        )}
      </div>
    </div>
  );
};

export default InvestmentsOverview;
