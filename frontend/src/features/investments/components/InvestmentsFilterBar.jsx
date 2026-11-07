import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

/**
 * Status filter options supported by backend Zod validator:
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
    <div className="bg-surface-card border border-border-subtle rounded-card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
      {/* Left: Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted mr-1">
          <Filter className="w-3.5 h-3.5 text-text-muted" />
          <span>Status:</span>
        </div>
        <div className="inline-flex items-center p-0.5 bg-surface-canvas border border-border-subtle rounded-button flex-wrap gap-1">
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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-surface-elevated text-text-primary border border-border-strong shadow-sm font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <span>{opt.label}</span>
                {typeof count === 'number' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-sans font-tabular tabular-nums ${
                      isSelected
                        ? 'bg-surface-card text-text-primary border border-border-subtle'
                        : 'bg-surface-elevated/70 text-text-muted'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Page Size Selector & Reset */}
      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Items per page"
            className="px-2.5 py-1.5 bg-surface-canvas border border-border-subtle rounded-button text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-semantic-focus cursor-pointer"
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
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary px-2.5 py-1.5 rounded-button bg-surface-elevated hover:bg-surface-card-hover border border-border-subtle transition-colors"
            title="Reset filters to default"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Filter</span>
          </button>
        )}

        {isFetching && (
          <span className="text-[11px] text-semantic-positive animate-pulse font-mono">
            Updating...
          </span>
        )}
      </div>
    </div>
  );
};

export default InvestmentsFilterBar;
