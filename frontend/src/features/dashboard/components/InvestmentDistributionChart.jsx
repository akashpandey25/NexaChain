import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { formatPaiseToINR, formatIndianNumber } from '../../../utils/formatters';
import { EmptyState } from '../../../components/feedback/EmptyState';

const STATUS_COLORS = {
  active: '#10b981',    // Emerald
  pending: '#f59e0b',   // Amber
  completed: '#3b82f6', // Blue
  cancelled: '#f43f5e'  // Rose
};

const STATUS_LABELS = {
  active: 'Active',
  pending: 'Pending',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

/**
 * Custom Tooltip for Donut Chart
 */
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const color = STATUS_COLORS[data.status] || '#94a3b8';

    return (
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 shadow-xl text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-white">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span>{STATUS_LABELS[data.status] || data.status}</span>
        </div>
        <div className="text-emerald-400 font-bold text-sm">
          {formatPaiseToINR(data.amountPaise)}
        </div>
        <div className="text-slate-400 text-[11px]">
          {data.count} {data.count === 1 ? 'package' : 'packages'}
        </div>
      </div>
    );
  }
  return null;
};

/**
 * InvestmentDistributionChart Component
 * Visualizes portfolio allocation breakdown across statuses using a Recharts Donut PieChart.
 */
export const InvestmentDistributionChart = ({ amountByStatus = [], totalCount = 0 }) => {
  // Filter out statuses with 0 paise and 0 count to prevent empty slices
  const chartSlices = Array.isArray(amountByStatus)
    ? amountByStatus
        .filter((item) => (item.amountPaise > 0 || item.count > 0))
        .map((item) => ({
          ...item,
          name: STATUS_LABELS[item.status] || item.status,
          value: item.amountPaise > 0 ? item.amountPaise / 100 : item.count // Use rupees or fallback to count
        }))
    : [];

  const hasData = chartSlices.length > 0 && totalCount > 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
            <PieIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Portfolio Allocation</h3>
            <p className="text-xs text-slate-400">Capital distributed across contract lifecycles</p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
          {formatIndianNumber(totalCount)} total
        </span>
      </div>

      <div className="pt-4 flex-1 min-h-[260px] flex items-center justify-center">
        {!hasData ? (
          <EmptyState
            icon={PieIcon}
            title="No Investments Allocated"
            description="Active or pending investment packages will plot here showing your lifecycle breakdown."
            className="w-full border-0 bg-transparent py-8"
          />
        ) : (
          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartSlices}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartSlices.map((entry) => (
                    <Cell
                      key={`cell-${entry.status}`}
                      fill={STATUS_COLORS[entry.status] || '#64748b'}
                      stroke="#0f172a"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-slate-300 font-medium px-1">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentDistributionChart;
