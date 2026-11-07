import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Accessible Pagination Component for Investments List
 * Driven directly by backend pagination metadata:
 * { currentPage, pageSize, totalRecords, totalPages, hasNextPage, hasPrevPage }
 * 
 * @param {object} props
 * @param {object} props.pagination Backend pagination metadata object
 * @param {function} props.onPageChange Callback when target page is selected
 * @param {boolean} [props.disabled] Whether controls should be disabled
 */
export const InvestmentsPagination = ({
  pagination = {},
  onPageChange,
  disabled = false
}) => {
  const {
    currentPage = 1,
    pageSize = 10,
    totalRecords = 0,
    totalPages = 1,
    hasNextPage = false,
    hasPrevPage = false
  } = pagination;

  if (totalRecords === 0) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  // Generate bounded visible page numbers (e.g. at most 5 page numbers around currentPage)
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
    <div className="bg-surface-card border border-border-subtle rounded-card px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs shadow-sm">
      {/* Information string */}
      <div className="text-text-muted">
        Showing <span className="font-semibold text-text-primary font-tabular tabular-nums">{startRecord}</span> to{' '}
        <span className="font-semibold text-text-primary font-tabular tabular-nums">{endRecord}</span> of{' '}
        <span className="font-semibold text-text-primary font-tabular tabular-nums">{totalRecords}</span> investments
      </div>

      {/* Pagination controls */}
      <nav
        role="navigation"
        aria-label="Pagination Navigation"
        className="flex items-center gap-1 self-center sm:self-auto"
      >
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage || disabled}
          aria-label="Go to previous page"
          className="inline-flex items-center justify-center p-1.5 rounded-button border border-border-subtle bg-surface-canvas text-text-secondary hover:bg-surface-elevated hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-semantic-focus"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* First Page button if clamped away */}
        {pageNumbers[0] > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              disabled={disabled}
              className="px-2.5 py-1 rounded-button border border-border-subtle bg-surface-canvas text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-semantic-focus font-tabular tabular-nums"
            >
              1
            </button>
            {pageNumbers[0] > 2 && (
              <span className="px-1 text-text-muted">...</span>
            )}
          </>
        )}

        {/* Page numbers */}
        {pageNumbers.map((pageNum) => {
          const isActive = pageNum === currentPage;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              disabled={disabled}
              aria-current={isActive ? 'page' : undefined}
              className={`min-w-8 px-2.5 py-1 rounded-button text-xs font-medium font-tabular tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-semantic-focus ${
                isActive
                  ? 'bg-surface-elevated text-text-primary border border-border-strong font-semibold shadow-sm'
                  : 'border border-border-subtle bg-surface-canvas text-text-muted hover:bg-surface-elevated hover:text-text-primary'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Last Page button if clamped away */}
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="px-1 text-text-muted">...</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              disabled={disabled}
              className="px-2.5 py-1 rounded-button border border-border-subtle bg-surface-canvas text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-semantic-focus font-tabular tabular-nums"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage || disabled}
          aria-label="Go to next page"
          className="inline-flex items-center justify-center p-1.5 rounded-button border border-border-subtle bg-surface-canvas text-text-secondary hover:bg-surface-elevated hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-semantic-focus"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
};

export default InvestmentsPagination;
