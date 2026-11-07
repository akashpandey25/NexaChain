import React, { useState } from 'react';
import {
  Clock,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Percent,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { useGetReferralIncomeQuery } from '../referralApi';
import {
  formatPaiseToINR,
  formatDateTime
} from '../../../utils/formatters';
import { ErrorMessage } from '../../../components/feedback/ErrorMessage';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { StatusBadge } from '../../../components/common/StatusBadge';

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
            <div key={i} className="h-20 bg-surface-card border border-border-subtle rounded-card" />
          ))}
        </div>
        <div className="h-12 bg-surface-card border border-border-subtle rounded-card" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-surface-card border border-border-subtle rounded-card p-4" />
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
    <div className="space-y-5">
      {/* Commission Inactive by Policy Notice Banner */}
      <div className="bg-surface-card border border-border-subtle rounded-card p-4 sm:p-5 flex items-start gap-3.5 text-xs shadow-sm">
        <ShieldAlert className="w-5 h-5 text-pending shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-text-primary">
            Referral Commission Processing Inactive by Policy
          </p>
          <p className="text-text-secondary leading-relaxed">
            In accordance with platform governance policy, multi-level referral commission distribution is currently disabled (<code className="text-brand-primary font-mono text-[11px]">IS_ENABLED: false</code>). Displayed records reflect historical ledger transactions if present. No automated commission accruals or wallet credits are generated for new investment contracts or daily yields under current operational rules.
          </p>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Processed Commissions (Credited) */}
        <div className="bg-surface-card border border-border-subtle rounded-card p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">
              Processed Commissions
            </span>
            <span className="text-xl font-bold text-semantic-positive mt-1 block font-tabular tabular-nums">
              {formatPaiseToINR(summary.processedIncomePaise || 0)}
            </span>
            <span className="text-[11px] text-text-secondary mt-0.5 block">
              Credited directly to available wallet
            </span>
          </div>
          <div className="p-2.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-button">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Pending Validation (Not Credited) */}
        <div className="bg-surface-card border border-border-subtle rounded-card p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">
              Pending Validation
            </span>
            <span className="text-xl font-bold text-pending mt-1 block font-tabular tabular-nums">
              {formatPaiseToINR(summary.pendingIncomePaise || 0)}
            </span>
            <span className="text-[11px] text-text-secondary mt-0.5 block">
              Awaiting qualification audit
            </span>
          </div>
          <div className="p-2.5 bg-pending/10 text-pending border border-pending/20 rounded-button">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Total Historical Commissions */}
        <div className="bg-surface-card border border-border-subtle rounded-card p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">
              Total Accrued
            </span>
            <span className="text-xl font-bold text-text-primary mt-1 block font-tabular tabular-nums">
              {formatPaiseToINR(summary.totalIncomePaise || 0)}
            </span>
            <span className="text-[11px] text-text-secondary mt-0.5 block">
              Across all network generations
            </span>
          </div>
          <div className="p-2.5 bg-surface-elevated text-text-secondary border border-border-subtle rounded-button">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Page Size Controls */}
      <div className="bg-surface-card border border-border-subtle rounded-card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        {/* Left: Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted mr-2">
            <Filter className="w-3.5 h-3.5 text-text-muted" />
            <span>Filter Status:</span>
          </div>
          {STATUS_FILTERS.map((f) => {
            const isSelected = status === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => handleStatusChange(f.value)}
                className={`px-3 py-1.5 rounded-button text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-brand-primary text-brand-primary-foreground font-semibold shadow-sm'
                    : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-border-subtle'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Right: Page Size & Reset */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
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

          {status !== 'all' && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary px-2.5 py-1 rounded-button bg-surface-elevated hover:bg-surface-hover border border-border-subtle transition-colors"
              title="Reset status filter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Filter</span>
            </button>
          )}

          {isFetching && (
            <span className="text-[11px] text-brand-primary animate-pulse font-mono">
              Loading...
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      {incomeRecords.length === 0 ? (
        <div className="bg-surface-card border border-border-subtle rounded-card p-8">
          <EmptyState
            title={status !== 'all' ? `No ${status.toUpperCase()} Commissions Found` : 'No Commission Records Yet'}
            description={
              status !== 'all'
                ? `There are no commission records with status "${status}". Try clearing the filter to inspect all disbursements.`
                : 'Referral commission payouts are currently inactive under platform policy. Any historical transactions will be audited and listed here.'
            }
            actionText={status !== 'all' ? 'Clear Status Filter' : undefined}
            onAction={status !== 'all' ? handleResetFilters : undefined}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block bg-surface-card border border-border-subtle rounded-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-elevated/40 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
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
                <tbody className="divide-y divide-border-subtle text-xs">
                  {incomeRecords.map((rec) => {
                    return (
                      <tr key={rec.id} className="hover:bg-surface-hover/50 transition-colors">
                        {/* Source User */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {rec.sourceUser ? (
                            <div>
                              <span className="font-semibold text-text-primary block">
                                {rec.sourceUser.name}
                              </span>
                              <span className="font-mono text-[11px] text-text-muted">
                                {rec.sourceUser.referralCode || rec.sourceUser.email || '—'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-text-muted italic">Downline Member</span>
                          )}
                        </td>

                        {/* Level */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            Level {rec.level}
                          </span>
                        </td>

                        {/* Rate */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {typeof rec.percentageApplied === 'number' ? (
                            <span className="inline-flex items-center gap-1 text-text-secondary font-mono tabular-nums">
                              <Percent className="w-3 h-3 text-brand-primary" />
                              {rec.percentageApplied}%
                            </span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-bold text-semantic-positive text-sm font-tabular tabular-nums">
                            +{formatPaiseToINR(rec.amountPaise)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <StatusBadge status={rec.status} />
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4 whitespace-nowrap text-right text-text-secondary font-medium">
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
              return (
                <div
                  key={rec.id}
                  className="bg-surface-card border border-border-subtle rounded-card p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Level {rec.level}
                    </span>
                    <StatusBadge status={rec.status} size="sm" />
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-text-muted uppercase tracking-wider block">Source Member</span>
                      <span className="font-semibold text-text-primary text-sm">
                        {rec.sourceUser?.name || 'Downline Affiliate'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-text-muted uppercase tracking-wider block">Disbursed</span>
                      <span className="font-bold text-semantic-positive text-base font-tabular tabular-nums">
                        +{formatPaiseToINR(rec.amountPaise)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border-subtle text-text-secondary">
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
            <div className="bg-surface-card border border-border-subtle rounded-card px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div className="text-text-secondary">
                Showing <span className="font-semibold text-text-primary font-tabular tabular-nums">{startRecord}</span> to{' '}
                <span className="font-semibold text-text-primary font-tabular tabular-nums">{endRecord}</span> of{' '}
                <span className="font-semibold text-text-primary font-tabular tabular-nums">{totalRecords}</span> commission records
              </div>

              <div className="flex items-center gap-1 self-center sm:self-auto">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!hasPrevPage || isFetching}
                  className="p-1.5 rounded-button border border-border-subtle bg-surface-canvas text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 font-semibold text-text-primary font-tabular tabular-nums">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={!hasNextPage || isFetching}
                  className="p-1.5 rounded-button border border-border-subtle bg-surface-canvas text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
