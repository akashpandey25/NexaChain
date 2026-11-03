import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  PiggyBank,
  ArrowUpRight,
  Calendar,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  formatPaiseToINR,
  formatBusinessDate,
  getStatusStyle
} from '../../../utils/formatters';
import { useGetInvestmentsQuery } from '../../investments/investmentApi';
import { useGetRoiHistoryQuery } from '../../roi/roiApi';
import { EmptyState } from '../../../components/feedback/EmptyState';

/**
 * RecentActivitySection Component
 * 
 * Provides verified financial activity logs:
 * 1. Confirmed Individual ROI Transactions (fetched from GET /api/roi/history with verified transaction statuses)
 * 2. Recent Investments (fetched from GET /api/investments)
 * 3. Daily ROI Summary (aggregated daily totals from dashboard chartData, correctly labeled without false transaction statuses)
 */
export const RecentActivitySection = ({ roiChartData = [] }) => {
  const [activeTab, setActiveTab] = useState('roiTransactions'); // 'roiTransactions' | 'investments' | 'roiSummary'

  // 1. Fetch genuine individual ROI transaction records
  const {
    data: roiHistoryData,
    isLoading: isRoiLoading
  } = useGetRoiHistoryQuery({ limit: 5 });

  const recentRoiTransactions =
    roiHistoryData?.roiRecords ||
    (Array.isArray(roiHistoryData) ? roiHistoryData : []);

  // 2. Fetch recent investment records
  const {
    data: investmentData,
    isLoading: isInvestmentsLoading
  } = useGetInvestmentsQuery({ limit: 5 });

  const recentInvestments =
    investmentData?.data?.investments ||
    (Array.isArray(investmentData?.data) ? investmentData.data : []);

  // 3. Prepare daily aggregated summary records (newest business dates first)
  const dailySummaryRecords = Array.isArray(roiChartData)
    ? [...roiChartData]
        .sort((a, b) => new Date(b.businessDate) - new Date(a.businessDate))
        .slice(0, 5)
    : [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      {/* Header with Switcher Tabs */}
      <div className="px-5 sm:px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Recent Activity & History</h3>
          <p className="text-xs text-slate-400">Verified transactions and daily distribution logs</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/80 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('roiTransactions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'roiTransactions'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>ROI Transactions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('investments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'investments'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Investments</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roiSummary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'roiSummary'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily ROI Summary</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Confirmed Individual ROI Transactions */}
      {activeTab === 'roiTransactions' && (
        <div>
          {isRoiLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading ROI transaction records...</div>
          ) : recentRoiTransactions.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={TrendingUp}
                title="No ROI Transactions Yet"
                description="Individual payout transaction records will appear here as the cron engine executes daily cycles."
                className="border-0 bg-transparent py-4"
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {recentRoiTransactions.map((tx) => {
                const statusStyle = getStatusStyle(tx.status);
                const planName = tx.investment?.planName || 'Standard';

                return (
                  <div
                    key={tx._id}
                    className="px-5 sm:px-6 py-3.5 flex items-center justify-between hover:bg-slate-800/30 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white">{planName} Plan ROI</p>
                          {tx.roiPercentage !== undefined && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({tx.roiPercentage}%)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {formatBusinessDate(tx.businessDate)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-emerald-400 text-sm">
                        +{formatPaiseToINR(tx.amountPaise)}
                      </p>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusStyle.badge}`}>
                        {statusStyle.label}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div className="px-6 py-3 bg-slate-950/50 text-right">
                <Link
                  to="/roi-history"
                  className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  View complete ROI transaction ledger
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
                          {formatBusinessDate(inv.createdAt)}
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

      {/* Tab 3: Daily ROI Summary (Aggregated Chart Data) */}
      {activeTab === 'roiSummary' && (
        <div>
          <div className="px-5 sm:px-6 py-2 bg-slate-950/60 border-b border-slate-800/60 text-[11px] text-slate-400">
            Note: Aggregated daily totals across all active investment packages. For individual transactions, see the ROI Transactions tab.
          </div>

          {dailySummaryRecords.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Calendar}
                title="No Daily Summary Records"
                description="Aggregated daily metrics will appear after automated scheduled runs."
                className="border-0 bg-transparent py-4"
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {dailySummaryRecords.map((item, idx) => (
                <div
                  key={`summary-${item.businessDate || idx}`}
                  className="px-5 sm:px-6 py-3.5 flex items-center justify-between hover:bg-slate-800/30 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Daily Aggregate Yield</p>
                      <p className="text-[11px] text-slate-400">
                        {formatBusinessDate(item.businessDate)} • {item.count || 1} active {item.count === 1 ? 'cycle' : 'cycles'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-emerald-400 text-sm">
                      {formatPaiseToINR(item.amountPaise)}
                    </p>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Daily Total
                    </span>
                  </div>
                </div>
              ))}

              <div className="px-6 py-3 bg-slate-950/50 text-right">
                <Link
                  to="/roi-history"
                  className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  View historical ledger
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
