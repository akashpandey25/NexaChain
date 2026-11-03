import React, { useState, useMemo } from 'react';
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
import {
  formatPaiseToINR,
  formatBusinessDate,
  formatChartBusinessDate
} from '../../../utils/formatters';
import { EmptyState } from '../../../components/feedback/EmptyState';

/**
 * Custom Tooltip for Recharts AreaChart
 */
const CustomRoiTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-[#0b101b] border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs space-y-1">
        <div className="text-slate-400 font-medium">
          {formatBusinessDate(dataPoint.businessDate)}
        </div>
        <div className="text-sm font-bold text-emerald-400">
          {formatPaiseToINR(dataPoint.amountPaise)}
        </div>
        {dataPoint.count !== undefined && (
          <div className="text-[11px] text-slate-500">
            {dataPoint.count} active {dataPoint.count === 1 ? 'investment cycle' : 'investment cycles'}
          </div>
        )}
      </div>
    );
  }
  return null;
};

/**
 * RoiHistoryChart Component
 * Visualizes historical daily ROI distributions over time with interactive timeframe filters.
 */
export const RoiHistoryChart = ({ chartData = [] }) => {
  const [timeframe, setTimeframe] = useState('30D');

  const filteredData = useMemo(() => {
    if (!Array.isArray(chartData) || chartData.length === 0) return [];
    
    // Sort chronologically by businessDate
    const sorted = [...chartData].sort((a, b) => 
      new Date(a.businessDate) - new Date(b.businessDate)
    );

    let count = sorted.length;
    if (timeframe === '7D') count = 7;
    else if (timeframe === '30D') count = 30;
    else if (timeframe === '90D') count = 90;

    const slice = count >= sorted.length ? sorted : sorted.slice(sorted.length - count);
    return slice.map((item) => ({
      ...item,
      rupees: (item.amountPaise || 0) / 100
    }));
  }, [chartData, timeframe]);

  const hasData = filteredData.length > 0;

  return (
    <div className="bg-[#0b101b] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full">
      {/* Header with Title and Timeframe Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">ROI Yield History & Growth</h3>
            <p className="text-xs text-slate-400">Daily automated payouts aggregated over calendar days</p>
          </div>
        </div>

        {/* Timeframe Filter Tabs */}
        <div className="inline-flex items-center p-1 bg-slate-950/90 border border-slate-800/80 rounded-xl self-start sm:self-auto text-xs font-semibold">
          {['7D', '30D', '90D', 'All'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTimeframe(tab)}
              className={`px-3 py-1 rounded-lg transition-all ${
                timeframe === tab
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
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
                data={filteredData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="roiGradientGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="businessDate"
                  tickFormatter={formatChartBusinessDate}
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
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#roiGradientGlow)"
                  activeDot={{ r: 5, fill: '#10b981', stroke: '#022c22', strokeWidth: 2 }}
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
