import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Lock,
  Clock,
  Layers
} from 'lucide-react';
import { formatPaiseToINR, formatBusinessDate } from '../../../utils/formatters';
import { useGetRoiHistoryQuery } from '../../roi/roiApi';
import { useGetInvestmentsQuery } from '../../investments/investmentApi';
import { EmptyState } from '../../../components/feedback/EmptyState';

export const RecentActivitySection = ({ roiChartData = [] }) => {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'roi' | 'investments'

  const { data: roiHistoryData, isLoading: isRoiLoading } = useGetRoiHistoryQuery({ limit: 8 });
  const { data: investmentData, isLoading: isInvLoading } = useGetInvestmentsQuery({ limit: 8 });

  const dynamicRecords = useMemo(() => {
    const list = [];

    // Real ROI transactions from GET /api/roi/history
    const roiRecords =
      roiHistoryData?.roiRecords ||
      roiHistoryData?.data?.roiRecords ||
      (Array.isArray(roiHistoryData?.data) ? roiHistoryData.data : []) ||
      (Array.isArray(roiHistoryData) ? roiHistoryData : []);
    roiRecords.forEach((item) => {
      list.push({
        id: item._id,
        title: item.investment?.planName ? `${item.investment.planName} Plan Yield` : 'Daily ROI Distribution',
        timestamp: `${formatBusinessDate(item.businessDate)} • Midnight IST`,
        txHash: item._id ? `REF-${item._id.slice(-8).toUpperCase()}` : 'RECORD',
        ledgerType: 'Daily ROI Yield',
        ledgerVariant: 'emerald',
        amount: `+${formatPaiseToINR(item.amountPaise)}`,
        amountColor: 'text-emerald-400',
        status: item.status === 'processed' ? 'Verified' : (item.status?.toUpperCase() || 'VERIFIED'),
        statusVariant: 'emerald',
        category: 'roi',
        icon: TrendingUp,
        date: new Date(item.createdAt || item.businessDate || 0)
      });
    });

    // Real investment activations from GET /api/investments
    const investments =
      investmentData?.investments ||
      investmentData?.data?.investments ||
      (Array.isArray(investmentData?.data) ? investmentData.data : []) ||
      (Array.isArray(investmentData) ? investmentData : []);
    investments.forEach((inv) => {
      list.push({
        id: inv._id,
        title: `Package Activation: ${inv.planName || 'Investment'}`,
        timestamp: `${formatBusinessDate(inv.createdAt)} • IST`,
        txHash: inv._id ? `REF-${inv._id.slice(-8).toUpperCase()}` : 'RECORD',
        ledgerType: 'Capital Principal',
        ledgerVariant: 'slate',
        amount: `-${formatPaiseToINR(inv.principalAmountPaise)}`,
        amountColor: 'text-slate-300',
        status: inv.status === 'active' ? 'Deployed' : (inv.status?.toUpperCase() || 'DEPLOYED'),
        statusVariant: 'slate',
        category: 'investments',
        icon: Lock,
        date: new Date(inv.createdAt || 0)
      });
    });

    // Sort newest first
    return list.sort((a, b) => b.date - a.date);
  }, [roiHistoryData, investmentData]);

  const filteredRecords = useMemo(() => {
    if (activeTab === 'all') return dynamicRecords;
    return dynamicRecords.filter((r) => r.category === activeTab);
  }, [dynamicRecords, activeTab]);

  const isLoading = isRoiLoading || isInvLoading;

  return (
    <div className="bg-[#0b101b] border border-slate-800/90 rounded-2xl overflow-hidden shadow-sm">
      {/* Header with Title and Filter Tabs */}
      <div className="p-5 sm:p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Recent Activity & History</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified transactions and daily distribution logs from cron execution engine
          </p>
        </div>

        {/* 3 Filter Tabs */}
        <div className="inline-flex items-center p-1 bg-slate-950/90 border border-slate-800/80 rounded-xl self-start sm:self-auto text-xs font-semibold overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'All Activity' },
            { id: 'roi', label: 'ROI Payouts' },
            { id: 'investments', label: 'Investments' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5-Column Table or Empty State */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-500">
          Syncing verified transaction history...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={Clock}
            title="No Activity Logged Yet"
            description="Verified payouts and contract activations will record here in real-time as cycles execute."
            className="w-full border-0 bg-transparent py-6"
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-5 sm:px-6">Timestamp & Package</th>
                <th className="py-3 px-5 sm:px-6">Reference ID</th>
                <th className="py-3 px-5 sm:px-6">Ledger Type</th>
                <th className="py-3 px-5 sm:px-6 text-right">Amount</th>
                <th className="py-3 px-5 sm:px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.map((item) => {
                const Icon = item.icon || TrendingUp;
                return (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    {/* Column 1: Package & Timestamp */}
                    <td className="py-3.5 px-5 sm:px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{item.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{item.timestamp}</div>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Hash */}
                    <td className="py-3.5 px-5 sm:px-6 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {item.txHash}
                    </td>

                    {/* Column 3: Ledger Type */}
                    <td className="py-3.5 px-5 sm:px-6 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold ${
                          item.ledgerVariant === 'emerald'
                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                            : 'bg-slate-900 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {item.ledgerType}
                      </span>
                    </td>

                    {/* Column 4: Amount */}
                    <td className={`py-3.5 px-5 sm:px-6 whitespace-nowrap text-right font-bold text-sm ${item.amountColor}`}>
                      {item.amount}
                    </td>

                    {/* Column 5: Status */}
                    <td className="py-3.5 px-5 sm:px-6 whitespace-nowrap text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.statusVariant === 'emerald'
                            ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-800/60'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Disclaimer */}
      <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>NexaChain executes automated settlement batches at midnight IST (Asia/Kolkata). Zero float latency.</span>
        </div>
        <div className="font-mono text-slate-400">
          Integer Paise Precision Ledger Active
        </div>
      </div>
    </div>
  );
};

export default RecentActivitySection;
