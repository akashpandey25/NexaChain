import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShieldCheck,
  Lock,
  Clock,
  ChevronRight
} from 'lucide-react';
import { formatPaiseToINR, formatBusinessDate } from '../../../utils/formatters';
import { useGetRoiHistoryQuery } from '../../roi/roiApi';
import { useGetInvestmentsQuery } from '../../investments/investmentApi';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { StatusBadge } from '../../../components/common/StatusBadge';

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
        amount: `+${formatPaiseToINR(item.amountPaise)}`,
        amountColor: 'text-semantic-positive',
        statusKey: item.status === 'processed' ? 'processed' : (item.status || 'processed'),
        statusLabel: 'Verified',
        category: 'roi',
        icon: TrendingUp,
        date: new Date(item.createdAt || item.businessDate || 0),
        detailUrl: '/roi-history'
      });
    });

    // Real investment records from GET /api/investments
    const investments =
      investmentData?.investments ||
      investmentData?.data?.investments ||
      (Array.isArray(investmentData?.data) ? investmentData.data : []) ||
      (Array.isArray(investmentData) ? investmentData : []);
    investments.forEach((inv) => {
      const isPending = inv.status === 'pending';
      const isActive = inv.status === 'active';
      const isCompleted = inv.status === 'completed';
      const isCancelled = inv.status === 'cancelled';

      const title = isPending
        ? `Investment Request: ${inv.planName || 'Package'}`
        : isActive
        ? `Active Contract: ${inv.planName || 'Investment'}`
        : isCompleted
        ? `Completed Contract: ${inv.planName || 'Investment'}`
        : `Cancelled Request: ${inv.planName || 'Investment'}`;

      const ledgerType = isPending
        ? 'Pending Request'
        : isActive
        ? 'Active Principal'
        : isCompleted
        ? 'Matured Principal'
        : 'Cancelled Request';

      const amount = isPending
        ? formatPaiseToINR(inv.principalAmountPaise)
        : `-${formatPaiseToINR(inv.principalAmountPaise)}`;

      const statusLabel = isPending
        ? 'Pending Review'
        : isActive
        ? 'Active'
        : isCompleted
        ? 'Completed'
        : 'Cancelled';

      const statusKey = isPending
        ? 'pending'
        : isActive
        ? 'active'
        : isCompleted
        ? 'completed'
        : 'cancelled';

      list.push({
        id: inv._id,
        title,
        timestamp: `${formatBusinessDate(inv.createdAt)} • IST`,
        txHash: inv._id ? `REF-${inv._id.slice(-8).toUpperCase()}` : 'RECORD',
        ledgerType,
        amount,
        amountColor: isPending ? 'text-semantic-pending' : 'text-text-primary',
        statusKey,
        statusLabel,
        category: 'investments',
        icon: Lock,
        date: new Date(inv.createdAt || 0),
        detailUrl: `/investments/${inv._id}`
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
    <div className="bg-surface-card border border-border-subtle rounded-card overflow-hidden shadow-sm">
      {/* Header with Title and Filter Tabs */}
      <div className="p-5 sm:p-6 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-text-primary tracking-tight">Recent Activity & History</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Verified transactions and daily distribution logs from settlement engine
          </p>
        </div>

        {/* 3 Filter Tabs */}
        <div className="inline-flex items-center p-0.5 bg-surface-canvas border border-border-subtle rounded-button self-start sm:self-auto text-xs font-medium overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'All Activity' },
            { id: 'roi', label: 'ROI Payouts' },
            { id: 'investments', label: 'Investments' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded-button whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-surface-elevated text-text-primary border border-border-strong shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table or Empty State */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-text-muted">
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
              <tr className="border-b border-border-subtle bg-surface-canvas/50 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                <th className="py-3 px-5 sm:px-6">Timestamp & Package</th>
                <th className="py-3 px-5 sm:px-6">Reference ID</th>
                <th className="py-3 px-5 sm:px-6">Ledger Type</th>
                <th className="py-3 px-5 sm:px-6 text-right">Amount</th>
                <th className="py-3 px-5 sm:px-6 text-right">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredRecords.map((item) => {
                const Icon = item.icon || TrendingUp;
                return (
                  <tr key={item.id} className="hover:bg-surface-card-hover/40 transition-colors">
                    {/* Column 1: Package & Timestamp */}
                    <td className="py-3.5 px-5 sm:px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border-subtle flex items-center justify-center text-text-secondary shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary text-xs">{item.title}</div>
                          <div className="text-[11px] text-text-muted mt-0.5">{item.timestamp}</div>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Reference Hash */}
                    <td className="py-3.5 px-5 sm:px-6 whitespace-nowrap font-mono text-[11px] text-text-muted">
                      {item.txHash}
                    </td>

                    {/* Column 3: Ledger Type */}
                    <td className="py-3.5 px-5 sm:px-6 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-surface-elevated text-text-secondary border border-border-subtle">
                        {item.ledgerType}
                      </span>
                    </td>

                    {/* Column 4: Amount */}
                    <td className={`py-3.5 px-5 sm:px-6 whitespace-nowrap text-right font-sans font-tabular tabular-nums font-semibold text-sm ${item.amountColor}`}>
                      {item.amount}
                    </td>

                    {/* Column 5: Status Badge */}
                    <td className="py-3.5 px-5 sm:px-6 whitespace-nowrap text-right">
                      <StatusBadge status={item.statusKey} label={item.statusLabel} size="sm" />
                    </td>

                    {/* Column 6: Navigable Detail Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <Link
                        to={item.detailUrl}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-semantic-focus rounded"
                        title={`View ${item.category === 'roi' ? 'ROI History' : 'Investment Contract'}`}
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Disclaimer */}
      <div className="p-4 bg-surface-canvas/50 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-text-muted">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-semantic-positive shrink-0" />
          <span>Automated settlement batches execute at midnight IST (Asia/Kolkata).</span>
        </div>
        <div className="font-tabular tabular-nums text-text-muted">
          Integer-Paise Precision Ledger
        </div>
      </div>
    </div>
  );
};

export default RecentActivitySection;
