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
      <div className="bg-surface-card border border-border-strong rounded-card p-3 shadow-xl text-xs space-y-1">
        <div className="text-text-muted font-medium">
          {formatBusinessDate(dataPoint.businessDate)}
        </div>
        <div className="text-sm font-bold text-semantic-positive font-sans font-tabular tabular-nums">
          {formatPaiseToINR(dataPoint.amountPaise)}
        </div>
        {dataPoint.count !== undefined && (
          <div className="text-[11px] text-text-secondary">
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
    <div className="bg-surface-card border border-border-subtle rounded-card p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full">
      {/* Header with Title and Timeframe Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border-subtle flex items-center justify-center text-semantic-positive shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary tracking-tight">ROI Yield History & Growth</h3>
            <p className="text-xs text-text-muted mt-0.5">Daily automated payouts aggregated over calendar days</p>
          </div>
        </div>

        {/* Timeframe Filter Tabs */}
        <div className="inline-flex items-center p-0.5 bg-surface-canvas border border-border-subtle rounded-button self-start sm:self-auto text-xs font-medium">
          {['7D', '30D', '90D', 'All'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTimeframe(tab)}
              className={`px-2.5 py-1 rounded-button transition-colors ${
                timeframe === tab
                  ? 'bg-surface-elevated text-text-primary border border-border-strong shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
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
                  <linearGradient id="roiGradientRestrained" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.20} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1B2438" vertical={false} />
                <XAxis
                  dataKey="businessDate"
                  tickFormatter={formatChartBusinessDate}
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#2A3752' }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
                />
                <Tooltip content={<CustomRoiTooltip />} />
                <Area
                  type="monotone"
                  dataKey="rupees"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#roiGradientRestrained)"
                  activeDot={{ r: 4, fill: '#10B981', stroke: '#111726', strokeWidth: 2 }}
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
