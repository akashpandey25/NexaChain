import React, { useState } from 'react';
import { Users, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGetDirectReferralsQuery } from '../referralApi';
import { formatBusinessDate, formatIndianNumber } from '../../../utils/formatters';
import { ErrorMessage } from '../../../components/feedback/ErrorMessage';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { StatusBadge } from '../../../components/common/StatusBadge';

/**
 * Direct Referrals Listing Component (Level 1 Affiliates)
 * Provides desktop table, mobile cards, and server-side pagination.
 */
export const DirectReferralsList = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [copiedId, setCopiedId] = useState(null);

  const { data, isLoading, error, refetch } = useGetDirectReferralsQuery({
    page,
    limit
  });

  const referrals = data?.referrals || [];
  const pagination = data?.pagination || {};

  const handleCopyCode = (code, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-surface-card border border-border-subtle rounded-card" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-surface-card border border-border-subtle rounded-card p-4" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title="Could Not Load Direct Referrals"
        message={error?.data?.message || error?.message || 'Failed to retrieve direct referral list.'}
        errors={error?.data?.errors}
        onRetry={refetch}
      />
    );
  }

  if (referrals.length === 0) {
    return (
      <div className="bg-surface-card border border-border-subtle rounded-card p-8">
        <EmptyState
          icon={Users}
          title="No Direct Referrals Yet"
          description="You haven't referred any affiliates yet. Share your personal referral code or registration link to invite partners and build your downline network."
        />
      </div>
    );
  }

  const {
    currentPage = 1,
    pageSize = 10,
    totalRecords = 0,
    totalPages = 1,
    hasNextPage = false,
    hasPrevPage = false
  } = pagination;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="space-y-4 min-w-0">
      {/* Controls & Count Header */}
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <div>
          Total Direct Referrals:{' '}
          <span className="font-semibold text-text-primary font-tabular tabular-nums">
            {formatIndianNumber(totalRecords)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-muted">Show:</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            aria-label="Items per page"
            className="px-2.5 py-1 bg-surface-canvas border border-border-subtle rounded-button text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary cursor-pointer transition-colors"
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-surface-card border border-border-subtle rounded-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-elevated/40 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                <th scope="col" className="px-5 py-3.5">
                  Affiliate Name
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Referral Code
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Account Status
                </th>
                <th scope="col" className="px-5 py-3.5 text-right">
                  Registration Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs">
              {referrals.map((ref) => {
                const isCopied = copiedId === ref.referralCode;
                return (
                  <tr key={ref.id} className="hover:bg-surface-hover/50 transition-colors">
                    {/* Name */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center font-bold text-xs text-brand-primary">
                          {ref.name ? ref.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="font-semibold text-text-primary">{ref.name}</span>
                      </div>
                    </td>

                    {/* Referral Code */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-indigo-400 font-medium">
                          {ref.referralCode || '—'}
                        </span>
                        {ref.referralCode && (
                          <button
                            type="button"
                            onClick={(e) => handleCopyCode(ref.referralCode, e)}
                            className="text-text-muted hover:text-text-primary p-1 rounded transition-colors"
                            title="Copy code"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-brand-primary" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge
                        status={ref.isActive ? 'active' : 'completed'}
                        label={ref.isActive ? 'ACTIVE' : 'INACTIVE'}
                      />
                    </td>

                    {/* Registration Date */}
                    <td className="px-5 py-4 whitespace-nowrap text-right text-text-secondary font-medium">
                      {formatBusinessDate(ref.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {referrals.map((ref) => {
          const isCopied = copiedId === ref.referralCode;
          return (
            <div
              key={ref.id}
              className="bg-surface-card border border-border-subtle rounded-card p-4 space-y-2.5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center font-bold text-xs text-brand-primary">
                    {ref.name ? ref.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="font-semibold text-text-primary text-sm">{ref.name}</span>
                </div>
                <StatusBadge
                  status={ref.isActive ? 'active' : 'completed'}
                  label={ref.isActive ? 'ACTIVE' : 'INACTIVE'}
                  size="sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border-subtle">
                <div>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider block">Referral Code</span>
                  <div className="flex items-center gap-1.5 font-mono text-indigo-400 font-medium">
                    <span>{ref.referralCode || '—'}</span>
                    {ref.referralCode && (
                      <button
                        type="button"
                        onClick={(e) => handleCopyCode(ref.referralCode, e)}
                        className="text-text-muted hover:text-text-primary p-0.5 rounded"
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3 text-brand-primary" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider block">Registered</span>
                  <span className="text-text-secondary font-medium">
                    {formatBusinessDate(ref.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-surface-card border border-border-subtle rounded-card px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="text-text-secondary">
            Showing <span className="font-semibold text-text-primary font-tabular tabular-nums">{startRecord}</span> to{' '}
            <span className="font-semibold text-text-primary font-tabular tabular-nums">{endRecord}</span> of{' '}
            <span className="font-semibold text-text-primary font-tabular tabular-nums">{totalRecords}</span> direct affiliates
          </div>

          <nav role="navigation" aria-label="Direct Referrals Pagination" className="flex items-center gap-1 self-center sm:self-auto">
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={!hasPrevPage}
              aria-label="Previous page"
              className="p-1.5 rounded-button border border-border-subtle bg-surface-canvas text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-semibold text-text-primary font-tabular tabular-nums">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={!hasNextPage}
              aria-label="Next page"
              className="p-1.5 rounded-button border border-border-subtle bg-surface-canvas text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default DirectReferralsList;
