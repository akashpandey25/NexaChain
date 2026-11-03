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
  active: '#10b981',    // Emerald
  completed: '#38bdf8', // Cyan
  pending: '#a855f7',   // Purple
  cancelled: '#64748b'  // Slate
};

const STATUS_LABELS = {
  active: 'Active Plans',
  completed: 'Completed Matured',
  pending: 'Pending Verification',
  cancelled: 'Cancelled'
};

/**
 * Custom Tooltip for Donut Chart
 */
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0b101b] border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-white">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: data.color || '#10b981' }}
          />
          <span>{data.name}</span>
        </div>
        <div className="text-emerald-400 font-bold text-sm">
          {formatPaiseToINR(data.amountPaise)}
        </div>
        {data.count !== undefined && (
          <div className="text-[11px] text-slate-400">
            {data.count} {data.count === 1 ? 'package' : 'packages'}
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
      color: STATUS_COLORS[statusKey] || '#10b981'
    };
  });

  return (
    <div className="bg-[#0b101b] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800/40 flex items-center justify-center text-cyan-400 shrink-0">
            <PieIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Portfolio Allocation</h3>
            <p className="text-xs text-slate-400">Lifecycle distribution breakdown</p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-slate-300 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
          {totalCount} Packages
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
            {/* Donut with Centered Label */}
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
                    stroke="#0b101b"
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

              {/* Centered 100% Deployed Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <span className="text-sm font-black text-white tracking-tight">100%</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">DEPLOYED</span>
              </div>
            </div>

            {/* Legend on Right */}
            <div className="flex flex-col gap-2.5 text-xs w-full sm:w-auto">
              {chartSlices.map((slice, idx) => (
                <div key={idx} className="flex items-center justify-between sm:justify-start gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="text-slate-300 font-medium truncate">{slice.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-400">
                    {slice.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contract Maturity Footer Box */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div>
          <span className="text-[11px] text-slate-400 block">Lifecycle Engine</span>
          <span className="font-semibold text-slate-200">
            {hasRealData ? `${totalCount} verified contracts monitored` : 'Awaiting contract activation'}
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          Midnight UTC Settlement
        </span>
      </div>
    </div>
  );
};

export default InvestmentDistributionChart;
