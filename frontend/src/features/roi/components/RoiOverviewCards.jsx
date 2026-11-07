import React from 'react';
import { TrendingUp, Clock, CheckCircle2, Calendar } from 'lucide-react';
import { formatPaiseToINR, formatBusinessDate, formatIndianNumber } from '../../../utils/formatters';
import { StatCard } from '../../../components/common/StatCard';

/**
 * ROI Overview KPI Cards Component
 * Standardized KPI metrics rendered via the canonical StatCard component.
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
            className="h-32 bg-surface-card border border-border-subtle rounded-card p-5"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Credited ROI */}
      <StatCard
        title="TOTAL CREDITED ROI"
        amountPaise={totalProcessedPaise}
        icon={TrendingUp}
        subtitle="Cumulatively credited to wallet balance"
        variant={totalProcessedPaise > 0 ? 'emerald' : 'default'}
        footerLeft="Cumulative ledger"
        footerRight={`${formatIndianNumber(processedCount)} confirmed credits`}
      />

      {/* Card 2: Posted Distributions */}
      <StatCard
        title="POSTED CREDITS"
        value={`${formatIndianNumber(processedCount)} ${processedCount === 1 ? 'credit' : 'credits'}`}
        icon={CheckCircle2}
        subtitle="Verified daily disbursements"
        variant="default"
        footerLeft="Server-verified"
        footerRight="Posted"
      />

      {/* Card 3: Pending Disbursements */}
      <StatCard
        title="PENDING RUNS"
        value={`${formatIndianNumber(pendingCount)} ${pendingCount === 1 ? 'batch' : 'batches'}`}
        icon={Clock}
        subtitle={pendingCount > 0 ? 'Queued for midnight execution' : 'All payouts current'}
        variant={pendingCount > 0 ? 'pending' : 'default'}
        footerLeft="00:00 IST engine"
        footerRight={pendingCount > 0 ? 'Pending' : 'Up to date'}
      />

      {/* Card 4: Latest Distribution */}
      <StatCard
        title="LATEST DISTRIBUTION"
        value={latestPayout ? formatPaiseToINR(latestPayout.amountPaise) : '—'}
        icon={Calendar}
        subtitle={
          latestPayout
            ? `Posted on ${formatBusinessDate(latestPayout.businessDate)}`
            : 'No historical distributions'
        }
        variant="default"
        footerLeft="Most recent"
        footerRight={latestPayout ? 'Credited' : 'None'}
      />
    </div>
  );
};

export default RoiOverviewCards;
