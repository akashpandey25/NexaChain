import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useGetRoiHistoryQuery, useGetRoiSummaryQuery } from '../../features/roi/roiApi';
import { TrendingUp, Calendar, CheckCircle2, DollarSign } from 'lucide-react';

const formatPaise = (paise = 0) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(paise / 100);
};

export const RoiHistoryPage = () => {
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    error: historyError,
    refetch: refetchHistory
  } = useGetRoiHistoryQuery();

  const {
    data: summaryData,
    isLoading: isSummaryLoading
  } = useGetRoiSummaryQuery();

  const history = historyData?.data?.history || (Array.isArray(historyData?.data) ? historyData.data : []);
  const summary = summaryData?.data || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily ROI History"
        subtitle="Automated daily returns credited directly by the NexaChain cron engine"
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Cumulative Yield</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {formatPaise(summary.totalEarnedPaise || 0)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Credited across all active cycles
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Payout Events</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {summary.totalPayoutsCount || history.length || 0}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Processed daily at 12:00 AM IST
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Engine Execution Status</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            ACTIVE
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Asia/Kolkata Node-Cron
          </div>
        </div>
      </div>

      {/* History Table */}
      {isHistoryLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Loading ROI history records..." />
        </div>
      ) : historyError ? (
        <ErrorMessage
          title="Could not load ROI history"
          message={historyError.message}
          onRetry={refetchHistory}
        />
      ) : history.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No Daily ROI Records Yet"
          description="Your active investments will generate daily ROI every night at 12:00 AM. Payout events will appear here once processed."
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h4 className="text-sm font-semibold text-white">Distribution Log</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Payout Date</th>
                  <th className="px-6 py-3">Investment ID</th>
                  <th className="px-6 py-3">ROI Amount</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {history.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">
                      {new Date(record.payoutDate || record.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">
                      {record.investmentId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400">
                      {formatPaise(record.roiAmountPaise)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        PROCESSED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
