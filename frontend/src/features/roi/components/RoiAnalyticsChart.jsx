import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  formatPaiseToINR,
  formatChartBusinessDate,
  formatBusinessDate
} from '../../../utils/formatters';
import { TrendingUp, BarChart2 } from 'lucide-react';

/**
 * Custom Tooltip for Daily ROI Analytics Area Chart
 */
const CustomChartTooltip = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface-card border border-border-strong rounded-card p-3 shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
        <div className="font-semibold text-text-primary border-b border-border-subtle pb-1 flex items-center justify-between gap-4">
          <span>{formatBusinessDate(data.businessDate)}</span>
          <span className="text-[10px] text-text-muted font-mono">Asia/Kolkata</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-secondary">Total Credited:</span>
          <span className="font-bold text-semantic-positive tabular-nums">
            {formatPaiseToINR(data.amountPaise)}
          </span>
        </div>
        {typeof data.count === 'number' && (
          <div className="flex items-center justify-between gap-4 text-[11px] text-text-muted">
            <span>Contracts Processed:</span>
            <span className="font-mono text-text-secondary">{data.count}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

/**
 * ROI Analytics Chart Component
 * Displays historical daily ROI disbursements over business dates.
 * 
 * @param {object} props
 * @param {Array} props.chartData Aggregated timeseries [{ businessDate, amountPaise, count }]
 * @param {boolean} [props.isLoading] Loading state
 */
export const RoiAnalyticsChart = ({ chartData = [], isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-surface-card border border-border-subtle rounded-card p-6 h-80 animate-pulse flex items-center justify-center">
        <div className="w-full h-full bg-surface-elevated/40 rounded-card" />
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-surface-card border border-border-subtle rounded-card p-8 text-center flex flex-col items-center justify-center min-h-[280px]">
        <div className="w-12 h-12 rounded-card bg-surface-elevated border border-border-subtle flex items-center justify-center text-text-muted mb-3">
          <BarChart2 className="w-6 h-6 text-brand-primary" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary">No Historical Credited ROI Yet</h3>
        <p className="text-xs text-text-secondary mt-1 max-w-sm">
          Daily return distributions are aggregated automatically across business dates. Chart trends will appear after active contracts receive their first midnight batch credit.
        </p>
      </div>
    );
  }

  // Transform data for charting (convert paise to rupees for Y-Axis)
  const formattedSeries = chartData.map((d) => ({
    ...d,
    amountRupees: (d.amountPaise || 0) / 100
  }));

  return (
    <div className="bg-surface-card border border-border-subtle rounded-card p-5 sm:p-6 shadow-sm">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-primary" />
            <h2 className="text-sm font-bold text-text-primary tracking-tight">
              Historical Credited ROI Performance
            </h2>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Aggregated daily returns credited across verified Asia/Kolkata business dates
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-semantic-positive/10 border border-semantic-positive/30 text-semantic-positive font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-semantic-positive" />
            {chartData.length} Business Dates
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedSeries}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="roiChartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1B2438" vertical={false} />

            <XAxis
              dataKey="businessDate"
              tickFormatter={formatChartBusinessDate}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#1B2438' }}
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
            />

            <Tooltip content={<CustomChartTooltip />} />

            <Area
              type="monotone"
              dataKey="amountRupees"
              name="Credited ROI"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#roiChartGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RoiAnalyticsChart;
