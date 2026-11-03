import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatPaiseToINR, formatChartDate, formatDate } from '../../../utils/formatters';
import { EmptyState } from '../../../components/feedback/EmptyState';

/**
 * Custom Tooltip for Recharts AreaChart
 */
const CustomRoiTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 shadow-xl text-xs space-y-1">
        <div className="text-slate-400 font-medium">
          {formatDate(dataPoint.businessDate)}
        </div>
        <div className="text-sm font-bold text-emerald-400">
          {formatPaiseToINR(dataPoint.amountPaise)}
        </div>
        {dataPoint.count !== undefined && (
          <div className="text-[11px] text-slate-500">
            {dataPoint.count} payout {dataPoint.count === 1 ? 'event' : 'events'}
          </div>
        )}
      </div>
    );
  }
  return null;
};

/**
 * RoiHistoryChart Component
 * Visualizes historical daily ROI distributions over time using a responsive Recharts AreaChart.
 */
export const RoiHistoryChart = ({ chartData = [] }) => {
  const hasData = Array.isArray(chartData) && chartData.length > 0;

  // Transform data for charting (convert paise to rupees for Y-axis scaling)
  const formattedData = hasData
    ? chartData.map((item) => ({
        ...item,
        rupees: (item.amountPaise || 0) / 100
      }))
    : [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">ROI Yield History</h3>
            <p className="text-xs text-slate-400">Daily automated returns generated over time</p>
          </div>
        </div>

        {hasData && (
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40">
            {formattedData.length} records
          </span>
        )}
      </div>

      <div className="pt-4 flex-1 min-h-[260px] flex items-center justify-center">
        {!hasData ? (
          <EmptyState
            icon={TrendingUp}
            title="No ROI History Recorded"
            description="Daily returns credited by the automated scheduler will plot here across business dates."
            className="w-full border-0 bg-transparent py-8"
          />
        ) : (
          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={formattedData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="businessDate"
                  tickFormatter={formatChartDate}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip content={<CustomRoiTooltip />} />
                <Area
                  type="monotone"
                  dataKey="rupees"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#roiGradient)"
                  activeDot={{ r: 5, fill: '#10b981', stroke: '#064e3b', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoiHistoryChart;
