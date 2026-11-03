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
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
      {/* Information string */}
      <div className="text-slate-400">
        Showing <span className="font-semibold text-white">{startRecord}</span> to{' '}
        <span className="font-semibold text-white">{endRecord}</span> of{' '}
        <span className="font-semibold text-white">{totalRecords}</span> investments
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
          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
              className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              1
            </button>
            {pageNumbers[0] > 2 && (
              <span className="px-1 text-slate-600">...</span>
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
              className={`min-w-8 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white'
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
              <span className="px-1 text-slate-600">...</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              disabled={disabled}
              className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 transition-colors"
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
          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
};

export default InvestmentsPagination;

