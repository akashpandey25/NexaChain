import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Accessible Pagination Component for ROI History
 * 
 * @param {object} props
 * @param {object} props.pagination Backend pagination metadata object
 * @param {function} props.onPageChange Callback on target page click
 * @param {boolean} [props.disabled] Disabled control state
 */
export const RoiPagination = ({
  pagination = {},
  onPageChange,
  disabled = false
}) => {
  const {
    currentPage = 1,
    limit = 10,
    totalRecords = 0,
    totalPages = 1,
    hasNextPage = false,
    hasPrevPage = false
  } = pagination;

  if (totalRecords === 0) return null;

  const startRecord = (currentPage - 1) * limit + 1;
  const endRecord = Math.min(currentPage * limit, totalRecords);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="bg-surface-card border border-border-subtle rounded-card px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
      <div className="text-text-secondary">
        Showing <span className="font-semibold text-text-primary font-tabular tabular-nums">{startRecord}</span> to{' '}
        <span className="font-semibold text-text-primary font-tabular tabular-nums">{endRecord}</span> of{' '}
        <span className="font-semibold text-text-primary font-tabular tabular-nums">{totalRecords}</span> payout distributions
      </div>

      <nav
        role="navigation"
        aria-label="Pagination Navigation"
        className="flex items-center gap-1 self-center sm:self-auto"
      >
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage || disabled}
          aria-label="Previous page"
          className="p-1.5 rounded-button border border-border-subtle bg-surface-canvas text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pageNumbers.map((pageNum) => {
          const isActive = pageNum === currentPage;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              disabled={disabled}
              className={`min-w-8 px-2.5 py-1 rounded-button text-xs font-medium transition-all ${
                isActive
                  ? 'bg-brand-primary text-brand-primary-foreground font-semibold shadow-sm'
                  : 'border border-border-subtle bg-surface-canvas text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage || disabled}
          aria-label="Next page"
          className="p-1.5 rounded-button border border-border-subtle bg-surface-canvas text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
};

export default RoiPagination;
