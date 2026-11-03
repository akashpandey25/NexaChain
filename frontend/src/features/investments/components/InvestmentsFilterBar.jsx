import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

/**
 * Status filter options supported by the backend Zod validator:
 * ['pending', 'active', 'completed', 'cancelled']
 */
const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

/**
 * Filter and Pagination Bar Component
 * Provides server-side status filtering, page size selection, and filter reset.
 * 
 * @param {object} props
 * @param {string} props.status Current selected status ('all', 'active', 'pending', 'completed', 'cancelled')
 * @param {function} props.onStatusChange Callback when status filter changes
 * @param {number} props.pageSize Current page size (limit)
 * @param {function} props.onPageSizeChange Callback when page size changes
 * @param {function} props.onReset Callback to reset filters
 * @param {object} [props.counts] Optional count breakdown for badges
 * @param {boolean} [props.isFetching] Whether a query is in-flight
 */
export const InvestmentsFilterBar = ({
  status = 'all',
  onStatusChange,
  pageSize = 10,
  onPageSizeChange,
  onReset,
  counts = {},
  isFetching = false
}) => {
  const isFiltered = status !== 'all';

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Left: Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mr-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Status:</span>
        </div>
        {STATUS_OPTIONS.map((opt) => {
          const isSelected = status === opt.value;
          const count =
            opt.value === 'all'
              ? counts.totalCount
              : counts[`${opt.value}Count`];

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onStatusChange(opt.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950 font-semibold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{opt.label}</span>
              {typeof count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? 'bg-emerald-800/80 text-white'
                      : 'bg-slate-700/80 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right: Page Size Selector & Reset */}
      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Items per page"
            className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
        </div>

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

export default InvestmentsFilterBar;
