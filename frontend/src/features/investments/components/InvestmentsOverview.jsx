import React from 'react';
import {
  Wallet,
  TrendingUp,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { formatIndianNumber } from '../../../utils/formatters';
import { StatCard } from '../../../components/common/StatCard';

/**
 * Investments Overview Cards Component
 * Standardized KPI metrics rendered via the canonical StatCard component.
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
            className="h-32 bg-surface-card border border-border-subtle rounded-card p-5"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Invested Principal */}
        <StatCard
          title="Total Invested"
          amountPaise={totalInvestmentPaise}
          icon={Wallet}
          subtitle="Cumulative principal allocated"
          variant="default"
        />

        {/* Card 2: Active Working Capital */}
        <StatCard
          title="Active Capital"
          amountPaise={activeInvestmentPaise}
          icon={TrendingUp}
          subtitle="Currently generating daily ROI"
          variant="positive"
        />

        {/* Card 3: Total Packages */}
        <StatCard
          title="Total Packages"
          value={formatIndianNumber(totalCount)}
          icon={Layers}
          subtitle={`${activeCount} active · ${pendingCount} pending`}
          variant="default"
        />

        {/* Card 4: Active Contracts */}
        <StatCard
          title="Active Contracts"
          value={formatIndianNumber(activeCount)}
          icon={CheckCircle2}
          subtitle={`${completedCount} completed · ${cancelledCount} cancelled`}
          variant="positive"
        />
      </div>

      {/* Status Breakdown Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-text-secondary">
        <span className="font-medium text-text-secondary">Portfolio Status:</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-semantic-positive/10 text-semantic-positive border border-semantic-positive/30 font-medium text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-semantic-positive" />
          Active: {activeCount}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-semantic-pending/10 text-semantic-pending border border-semantic-pending/30 font-medium text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-semantic-pending" />
          Pending: {pendingCount}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-elevated text-text-secondary border border-border-strong font-medium text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-text-secondary" />
          Completed: {completedCount}
        </span>
        {cancelledCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-semantic-danger/10 text-semantic-danger border border-semantic-danger/30 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-semantic-danger" />
            Cancelled: {cancelledCount}
          </span>
        )}
      </div>
    </div>
  );
};

export default InvestmentsOverview;
