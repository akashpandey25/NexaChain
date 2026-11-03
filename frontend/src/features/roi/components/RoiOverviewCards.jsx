import React from 'react';
import { TrendingUp, Clock, CheckCircle2, Calendar, Wallet, AlertCircle } from 'lucide-react';
import { formatPaiseToINR, formatBusinessDate, formatIndianNumber } from '../../../utils/formatters';

/**
 * ROI Overview KPI Cards Component
 * Renders verified summary metrics directly from the backend summary endpoint.
 * 
 * @param {object} props
 * @param {object} props.summary ROI summary statistics from GET /api/roi/summary
 * @param {boolean} [props.isLoading] Loading state
 */
export const RoiOverviewCards = ({ summary = {}, isLoading = false }) => {
  const totalProcessedPaise = summary?.totalProcessedRoiPaise ?? 0;
  const processedCount = summary?.processedCount ?? 0;
  const pendingCount = summary?.pendingCount ?? 0;
  const totalRecords = summary?.totalRecords ?? 0;
  const latestPayout = summary?.latestPayout;

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
      {/* Card 1: Total Processed ROI */}
      <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition-all shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Processed ROI
          </span>
          <div className="p-2 bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded-lg">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 text-2xl font-bold tracking-tight text-emerald-400">
          {formatPaiseToINR(totalProcessedPaise)}
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Credited directly to available wallet
        </p>
      </div>

      {/* Card 2: Pending Processing */}
      <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition-all shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Pending Executions
          </span>
          <div className="p-2 bg-amber-950/60 text-amber-400 border border-amber-800/40 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 text-2xl font-bold tracking-tight text-white">
          {formatIndianNumber(pendingCount)} {pendingCount === 1 ? 'event' : 'events'}
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Awaiting next daily batch run
        </p>
      </div>

      {/* Card 3: Total ROI Distributions */}
      <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition-all shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Distribution Events
          </span>
          <div className="p-2 bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 rounded-lg">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 text-2xl font-bold tracking-tight text-white">
          {formatIndianNumber(totalRecords)}
        </div>
        <p className="mt-1 text-xs text-slate-400">
          {processedCount} confirmed disbursements
        </p>
      </div>

      {/* Card 4: Latest Payout Event */}
      <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition-all shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Latest Distribution
          </span>
          <div className="p-2 bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 text-2xl font-bold tracking-tight text-white">
          {latestPayout ? formatPaiseToINR(latestPayout.amountPaise) : '—'}
        </div>
        <p className="mt-1 text-xs text-slate-400">
          {latestPayout
            ? `On ${formatBusinessDate(latestPayout.businessDate)}`
            : 'No historical distributions'}
        </p>
      </div>
    </div>
  );
};

export default RoiOverviewCards;

