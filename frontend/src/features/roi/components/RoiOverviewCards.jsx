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
      {/* Card 1: Total Processed ROI */}
      <StatCard
        title="Total Processed ROI"
        amountPaise={totalProcessedPaise}
        icon={TrendingUp}
        subtitle="Credited directly to available wallet"
        variant="positive"
      />

      {/* Card 2: Pending Executions */}
      <StatCard
        title="Pending Executions"
        value={`${formatIndianNumber(pendingCount)} ${pendingCount === 1 ? 'event' : 'events'}`}
        icon={Clock}
        subtitle="Awaiting next daily batch run"
        variant={pendingCount > 0 ? 'pending' : 'default'}
      />

      {/* Card 3: Total ROI Distributions */}
      <StatCard
        title="Distribution Events"
        value={formatIndianNumber(totalRecords)}
        icon={Calendar}
        subtitle={`${processedCount} confirmed disbursements`}
        variant="default"
      />

      {/* Card 4: Latest Payout Event */}
      <StatCard
        title="Latest Distribution"
        value={latestPayout ? formatPaiseToINR(latestPayout.amountPaise) : '—'}
        icon={CheckCircle2}
        subtitle={
          latestPayout
            ? `On ${formatBusinessDate(latestPayout.businessDate)}`
            : 'No historical distributions'
        }
        variant="default"
      />
    </div>
  );
};

export default RoiOverviewCards;
