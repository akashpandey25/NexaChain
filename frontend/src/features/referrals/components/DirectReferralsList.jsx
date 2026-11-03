import React, { useState } from 'react';
import { Users, UserCheck, UserX, Calendar, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGetDirectReferralsQuery } from '../referralApi';
import { formatBusinessDate, formatIndianNumber } from '../../../utils/formatters';
import { ErrorMessage } from '../../../components/feedback/ErrorMessage';
import { EmptyState } from '../../../components/feedback/EmptyState';

/**
 * Direct Referrals Listing Component (Level 1 Affiliates)
 * Provides desktop table, mobile cards, and server-side pagination.
 */
export const DirectReferralsList = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [copiedId, setCopiedId] = useState(null);

  const { data, isLoading, isFetching, error, refetch } = useGetDirectReferralsQuery({
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
        <div className="h-10 bg-slate-800/60 rounded-xl" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-900/60 border border-slate-800 rounded-xl p-4" />
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
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8">
        <EmptyState
          icon={Users}
          title="No Direct Referrals Yet"
          description="You haven't referred any affiliates yet. Share your referral code or registration link to invite partners and build your downline."
        />
      </div>
    );
  }

  const { currentPage = 1, pageSize = 10, totalRecords = 0, totalPages = 1, hasNextPage = false, hasPrevPage = false } = pagination;
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="space-y-4">
      {/* Controls & Count Header */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div>
          Total Direct Referrals:{' '}
          <span className="font-semibold text-white">{formatIndianNumber(totalRecords)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Show:</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            aria-label="Items per page"
            className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
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
      <div className="hidden md:block bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
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
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {referrals.map((ref) => {
                const isCopied = copiedId === ref.referralCode;
                return (
                  <tr key={ref.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Name */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400">
                          {ref.name ? ref.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="font-semibold text-white">{ref.name}</span>
                      </div>
                    </td>

                    {/* Referral Code */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-indigo-300 font-medium">
                          {ref.referralCode || '—'}
                        </span>
                        {ref.referralCode && (
                          <button
                            type="button"
                            onClick={(e) => handleCopyCode(ref.referralCode, e)}
                            className="text-slate-500 hover:text-slate-300 p-1"
                            title="Copy code"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {ref.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/70 text-emerald-400 border border-emerald-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          INACTIVE
                        </span>
                      )}
                    </td>

                    {/* Registration Date */}
                    <td className="px-5 py-4 whitespace-nowrap text-right text-slate-300 font-medium">
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
              className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2.5 shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400">
                    {ref.name ? ref.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="font-semibold text-white text-sm">{ref.name}</span>
                </div>
                {ref.isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/60">
                    ACTIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                    INACTIVE
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/70">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Referral Code</span>
                  <div className="flex items-center gap-1.5 font-mono text-indigo-300 font-medium">
                    <span>{ref.referralCode || '—'}</span>
                    {ref.referralCode && (
                      <button
                        type="button"
                        onClick={(e) => handleCopyCode(ref.referralCode, e)}
                        className="text-slate-500 hover:text-slate-300"
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Registered</span>
                  <span className="text-slate-300 font-medium">
                    {formatBusinessDate(ref.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Accessible Pagination */}
      {totalPages > 1 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="text-slate-400">
            Showing <span className="font-semibold text-white">{startRecord}</span> to{' '}
            <span className="font-semibold text-white">{endRecord}</span> of{' '}
            <span className="font-semibold text-white">{totalRecords}</span> direct referrals
          </div>

          <div className="flex items-center gap-1 self-center sm:self-auto">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!hasPrevPage || isFetching}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-mono text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={!hasNextPage || isFetching}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectReferralsList;
