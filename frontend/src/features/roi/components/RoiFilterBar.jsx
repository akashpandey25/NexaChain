import React from 'react';
import { Filter, Calendar, RotateCcw } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'processed', label: 'Processed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' }
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

/**
 * Filter and Controls Bar for ROI History
 * 
 * @param {object} props
 * @param {string} props.status Current selected status
 * @param {function} props.onStatusChange Callback on status change
 * @param {string} props.startDate Start date filter (YYYY-MM-DD)
 * @param {string} props.endDate End date filter (YYYY-MM-DD)
 * @param {function} props.onDateChange Callback for start/end date change
 * @param {number} props.pageSize Selected page limit
 * @param {function} props.onPageSizeChange Callback on limit change
 * @param {function} props.onReset Callback to clear all filters
 * @param {boolean} [props.isFetching] Query in-flight state
 */
export const RoiFilterBar = ({
  status = 'all',
  onStatusChange,
  startDate = '',
  endDate = '',
  onDateChange,
  pageSize = 10,
  onPageSizeChange,
  onReset,
  isFetching = false
}) => {
  const isFiltered = status !== 'all' || Boolean(startDate) || Boolean(endDate);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Left: Status Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mr-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Status:</span>
        </div>
        {STATUS_OPTIONS.map((opt) => {
          const isSelected = status === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onStatusChange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-950'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Right: Date Range and Page Size */}
      <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 shrink-0">
        {/* Date Range Inputs */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => onDateChange('startDate', e.target.value)}
            aria-label="Start Date"
            className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onDateChange('endDate', e.target.value)}
            aria-label="End Date"
            className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Records per page"
            className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 transition-colors"
            title="Reset filters to default"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Filter</span>
          </button>
        )}

        {isFetching && (
          <span className="text-[11px] text-emerald-400 animate-pulse font-mono">
            Updating...
          </span>
        )}
      </div>
    </div>
  );
};

export default RoiFilterBar;
