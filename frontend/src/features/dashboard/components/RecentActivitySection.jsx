import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, PiggyBank, ArrowUpRight, Clock, CheckCircle2 } from 'lucide-react';
import { formatPaiseToINR, formatDate, getStatusStyle } from '../../../utils/formatters';
import { useGetInvestmentsQuery } from '../../investments/investmentApi';
import { EmptyState } from '../../../components/feedback/EmptyState';

/**
 * RecentActivitySection Component
 * Displays recent transactional activity supported by the backend:
 * 1. Recent Daily ROI Distributions from aggregated dashboard response
 * 2. Recent Investments from investments endpoint
 */
export const RecentActivitySection = ({ roiChartData = [] }) => {
  const [activeTab, setActiveTab] = useState('roi'); // 'roi' | 'investments'

  // Fetch recent investments (limit 5) for activity history
  const {
    data: investmentData,
    isLoading: isInvestmentsLoading
  } = useGetInvestmentsQuery({ limit: 5 });

  const recentInvestments = investmentData?.data?.investments || (Array.isArray(investmentData?.data) ? investmentData.data : []);

  // Sort ROI records newest first for activity log
  const recentRoiRecords = Array.isArray(roiChartData)
    ? [...roiChartData].sort((a, b) => new Date(b.businessDate) - new Date(a.businessDate)).slice(0, 5)
    : [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      {/* Header with Switcher Tabs */}
      <div className="px-5 sm:px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Recent Activity</h3>
          <p className="text-xs text-slate-400">Latest earnings payouts and portfolio allocations</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('roi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'roi'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>ROI Distributions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('investments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'investments'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Investments</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Recent Daily ROI Distributions */}
      {activeTab === 'roi' && (
        <div>
          {recentRoiRecords.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={TrendingUp}
                title="No Recent ROI Distributions"
                description="Payout records will be listed here after each midnight cron run."
                className="border-0 bg-transparent py-4"
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {recentRoiRecords.map((item, idx) => (
                <div
                  key={`roi-${item.businessDate || idx}`}
                  className="px-5 sm:px-6 py-3.5 flex items-center justify-between hover:bg-slate-800/30 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Daily ROI Yield</p>
                      <p className="text-[11px] text-slate-400">
                        {formatDate(item.businessDate)} • {item.count || 1} {item.count === 1 ? 'cycle' : 'cycles'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-emerald-400 text-sm">
                      +{formatPaiseToINR(item.amountPaise)}
                    </p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                      CREDITED
                    </span>
                  </div>
                </div>
              ))}

              <div className="px-6 py-3 bg-slate-950/50 text-right">
                <Link
                  to="/roi-history"
                  className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  View full ROI ledger
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Recent Investments */}
      {activeTab === 'investments' && (
        <div>
          {isInvestmentsLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading recent investments...</div>
          ) : recentInvestments.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={PiggyBank}
                title="No Investments Yet"
                description="Investments you create will appear here."
                className="border-0 bg-transparent py-4"
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {recentInvestments.map((inv) => {
                const style = getStatusStyle(inv.status);
                return (
                  <div
                    key={inv._id}
                    className="px-5 sm:px-6 py-3.5 flex items-center justify-between hover:bg-slate-800/30 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300">
                        <PiggyBank className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {inv.planName ? `${inv.planName} Package` : 'Investment Package'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {formatDate(inv.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-white text-sm">
                        {formatPaiseToINR(inv.principalAmountPaise)}
                      </p>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${style.badge}`}>
                        {style.label}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div className="px-6 py-3 bg-slate-950/50 text-right">
                <Link
                  to="/investments"
                  className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  Manage all investments
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecentActivitySection;
