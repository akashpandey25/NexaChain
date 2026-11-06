import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { PieChart as PieIcon, ShieldCheck } from 'lucide-react';
import { formatPaiseToINR } from '../../../utils/formatters';
import { EmptyState } from '../../../components/feedback/EmptyState';

const STATUS_COLORS = {
  active: '#10B981',    // Semantic positive
  completed: '#64748B', // Neutral/slate
  pending: '#F59E0B',   // Semantic pending
  cancelled: '#EF4444'  // Semantic danger
};

const STATUS_LABELS = {
  active: 'Active Plans',
  completed: 'Completed Plans',
  pending: 'Pending Review',
  cancelled: 'Cancelled'
};

/**
 * Custom Tooltip for Donut Chart
 */
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface-card border border-border-strong rounded-card p-3 shadow-xl text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-text-primary">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: data.color || '#10B981' }}
          />
          <span>{data.name}</span>
        </div>
        <div className="text-semantic-positive font-bold text-sm font-sans font-tabular tabular-nums">
          {formatPaiseToINR(data.amountPaise)}
        </div>
        {data.count !== undefined && (
          <div className="text-[11px] text-text-muted">
            {data.count} {data.count === 1 ? 'package' : 'packages'} ({data.percent}%)
          </div>
        )}
      </div>
    );
  }
  return null;
};

/**
 * InvestmentDistributionChart Component
 * Visualizes genuine portfolio allocation breakdown across statuses.
 * Contains ZERO hardcoded dummy packages or fake maturity countdowns.
 */
export const InvestmentDistributionChart = ({ amountByStatus = [], totalCount = 0 }) => {
  const activeSlices = Array.isArray(amountByStatus)
    ? amountByStatus.filter((item) => item.amountPaise > 0 || item.count > 0)
    : [];

  const hasRealData = activeSlices.length > 0 && totalCount > 0;

  const totalPaise = activeSlices.reduce((acc, curr) => acc + (curr.amountPaise || 0), 0);

  const chartSlices = activeSlices.map((item) => {
    const statusKey = item.status?.toLowerCase() || 'active';
    const percent = totalPaise > 0 ? Math.round(((item.amountPaise || 0) / totalPaise) * 100) : 0;
    return {
      name: STATUS_LABELS[statusKey] || `${statusKey.toUpperCase()} Plans`,
      value: item.amountPaise > 0 ? item.amountPaise / 100 : item.count,
      amountPaise: item.amountPaise || 0,
      count: item.count || 0,
      percent,
      color: STATUS_COLORS[statusKey] || '#10B981'
    };
  });

  return (
    <div className="bg-surface-card border border-border-subtle rounded-card p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border-subtle flex items-center justify-center text-text-secondary shrink-0">
            <PieIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary tracking-tight">Portfolio Allocation</h3>
            <p className="text-xs text-text-muted mt-0.5">Lifecycle distribution breakdown</p>
          </div>
        </div>

        <span className="text-[11px] font-medium text-text-secondary bg-surface-elevated px-2.5 py-0.5 rounded-full border border-border-subtle">
          {totalCount} {totalCount === 1 ? 'Package' : 'Packages'}
        </span>
      </div>

      {/* Donut and Legend Body */}
      <div className="pt-4 flex-1 flex flex-col items-center justify-center min-h-[200px]">
        {!hasRealData ? (
          <EmptyState
            icon={PieIcon}
            title="No Investments Allocated"
            description="Active capital packages and contract lifecycles will plot here once an investment is created."
            className="w-full border-0 bg-transparent py-6"
          />
        ) : (
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* Donut with Centered Count */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartSlices}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="#111726"
                    strokeWidth={3}
                  >
                    {chartSlices.map((entry, idx) => (
                      <Cell
                        key={`slice-${idx}`}
                        fill={entry.color}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Packages Count */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <span className="text-base font-bold text-text-primary font-sans font-tabular tabular-nums">
                  {totalCount}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                  {totalCount === 1 ? 'Package' : 'Packages'}
                </span>
              </div>
            </div>

            {/* Legend on Right */}
            <div className="flex flex-col gap-2.5 text-xs w-full sm:w-auto">
              {chartSlices.map((slice, idx) => (
                <div key={idx} className="flex items-center justify-between sm:justify-start gap-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="text-text-secondary font-medium truncate">{slice.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-sans font-tabular tabular-nums">
                    <span className="text-text-primary font-medium">
                      {formatPaiseToINR(slice.amountPaise)}
                    </span>
                    <span className="text-text-muted text-[11px]">
                      ({slice.percent}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contract Lifecycle Footer Box */}
      <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
        <div>
          <span className="text-[11px] text-text-muted block">Contract Lifecycle</span>
          <span className="font-medium text-text-secondary">
            {hasRealData ? `${totalCount} verified contracts monitored` : 'Awaiting contract creation'}
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-semantic-positive/10 text-semantic-positive border border-semantic-positive/30 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Midnight IST Settlement
        </span>
      </div>
    </div>
  );
};

export default InvestmentDistributionChart;
