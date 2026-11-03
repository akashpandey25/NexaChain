import React, { useState } from 'react';
import {
  Wallet,
  Clock,
  AlertCircle,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useGetReferralIncomeQuery } from '../referralApi';
import {
  formatPaiseToINR,
  formatDateTime,
  getStatusStyle,
  formatIndianNumber
} from '../../../utils/formatters';
import { ErrorMessage } from '../../../components/feedback/ErrorMessage';
import { EmptyState } from '../../../components/feedback/EmptyState';

const STATUS_FILTERS = [
  { value: 'all', label: 'All Records' },
  { value: 'processed', label: 'Processed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' }
];

/**
 * Referral Income History Component
 * Audits all affiliate commission disbursements, source downlines, and settlement statuses.
 */
export const ReferralIncomeHistory = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState('all');

  const queryParams = {
    page,
    limit,
    ...(status !== 'all' ? { status } : {})
  };

  const { data, isLoading, isFetching, error, refetch } = useGetReferralIncomeQuery(queryParams);

  const incomeRecords = data?.incomeRecords || [];
  const summary = data?.summary || {};
  const pagination = data?.pagination || {};

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleResetFilters = () => {
    setStatus('all');
    setPage(1);
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-900/60 border border-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="h-12 bg-slate-800/60 rounded-xl" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-900/60 border border-slate-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title="Could Not Load Commission Income"
        message={error?.data?.message || error?.message || 'Failed to retrieve referral commission records.'}
        errors={error?.data?.errors}
        onRetry={refetch}
      />
    );
  }

  const { currentPage = 1, pageSize = 10, totalRecords = 0, totalPages = 1, hasNextPage = false, hasPrevPage = false } = pagination;
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="space-y-5">
      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Processed Income (Credited) */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Processed Commissions
            </span>
            <span className="text-xl font-bold text-emerald-400 mt-1 block">
              {formatPaiseToINR(summary.processedIncomePaise || 0)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Credited directly to available wallet
            </span>
          </div>
          <div className="p-2.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Pending Income (Not Credited) */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Pending Validation
            </span>
            <span className="text-xl font-bold text-amber-400 mt-1 block">
              {formatPaiseToINR(summary.pendingIncomePaise || 0)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Awaiting qualification audit
            </span>
          </div>
          <div className="p-2.5 bg-amber-950/60 text-amber-400 border border-amber-800/40 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Total Historical Commissions */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Accrued
            </span>
            <span className="text-xl font-bold text-white mt-1 block">
              {formatPaiseToINR(summary.totalIncomePaise || 0)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Across all network generations
            </span>
          </div>
          <div className="p-2.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Page Size Controls */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mr-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter Status:</span>
          </div>
          {STATUS_FILTERS.map((f) => {
            const isSelected = status === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => handleStatusChange(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-950'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Right: Page Size & Reset */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Show:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Items per page"
              className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>

          {status !== 'all' && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 transition-colors"
              title="Reset status filter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Filter</span>
            </button>
          )}

          {isFetching && (
            <span className="text-[11px] text-emerald-400 animate-pulse font-mono">
              Loading...
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      {incomeRecords.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8">
          <EmptyState
            icon={Wallet}
            title={status !== 'all' ? `No ${status.toUpperCase()} Commissions Found` : 'No Commission Records Yet'}
            description={
              status !== 'all'
                ? `There are no commission records with status "${status}". Try clearing the filter to inspect all disbursements.`
                : 'Referral commission payouts will be listed here automatically when members of your downline network activate investment packages or accrue daily yields.'
            }
            actionText={status !== 'all' ? 'Clear Status Filter' : undefined}
            onAction={status !== 'all' ? handleResetFilters : undefined}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th scope="col" className="px-5 py-3.5">
                      Source Affiliate
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Network Level
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Commission Rate
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Disbursed Amount
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-right">
                      Date & Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {incomeRecords.map((rec) => {
                    const statusStyle = getStatusStyle(rec.status);
                    return (
                      <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Source User */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {rec.sourceUser ? (
                            <div>
                              <span className="font-semibold text-white block">
                                {rec.sourceUser.name}
                              </span>
                              <span className="font-mono text-[11px] text-slate-400">
                                {rec.sourceUser.referralCode || rec.sourceUser.email || '—'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Downline Member</span>
                          )}
                        </td>

                        {/* Level */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/50">
                            Level {rec.level}
                          </span>
                        </td>

                        {/* Rate */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {typeof rec.percentageApplied === 'number' ? (
                            <span className="inline-flex items-center gap-1 text-slate-300 font-mono">
                              <Percent className="w-3 h-3 text-emerald-400" />
                              {rec.percentageApplied}%
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-bold text-emerald-400 text-sm">
                            +{formatPaiseToINR(rec.amountPaise)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                            {statusStyle.label}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4 whitespace-nowrap text-right text-slate-300">
                          {formatDateTime(rec.createdAt)}
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
            {incomeRecords.map((rec) => {
              const statusStyle = getStatusStyle(rec.status);
              return (
                <div
                  key={rec.id}
                  className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/50">
                      Level {rec.level}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusStyle.badge}`}
                    >
                      <span className={`w-1 h-1 rounded-full ${statusStyle.dot}`} />
                      {statusStyle.label}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Source Member</span>
                      <span className="font-semibold text-white text-sm">
                        {rec.sourceUser?.name || 'Downline Affiliate'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase block">Disbursed</span>
                      <span className="font-bold text-emerald-400 text-base">
                        +{formatPaiseToINR(rec.amountPaise)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/70 text-slate-400">
                    <span>
                      {typeof rec.percentageApplied === 'number'
                        ? `Rate: ${rec.percentageApplied}%`
                        : ''}
                    </span>
                    <span>{formatDateTime(rec.createdAt)}</span>
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
                <span className="font-semibold text-white">{totalRecords}</span> commission records
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
      )}
    </div>
  );
};

export default ReferralIncomeHistory;
