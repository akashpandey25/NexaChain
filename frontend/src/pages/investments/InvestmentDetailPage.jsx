import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';
import { EmptyState } from '../../components/feedback/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useGetInvestmentByIdQuery } from '../../features/investments/investmentApi';
import { InvestmentDetailSkeleton } from '../../features/investments/components/InvestmentDetailSkeleton';
import {
  formatPaiseToINR,
  formatBusinessDate,
  formatDateTime
} from '../../utils/formatters';
import {
  ArrowLeft,
  PiggyBank,
  TrendingUp,
  Percent,
  ShieldCheck,
  Clock,
  Copy,
  Check,
  FileText,
  AlertCircle
} from 'lucide-react';

/**
 * Investment Details Page
 * Displays full contract details, dates, and server-calculated ROI accumulation.
 * Scoped strictly to the authenticated owner.
 */
export const InvestmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    data: investment,
    isLoading,
    isFetching,
    error,
    refetch
  } = useGetInvestmentByIdQuery(id);

  const [copied, setCopied] = useState(false);

  const handleCopyId = (e) => {
    e.preventDefault();
    if (investment?._id) {
      navigator.clipboard?.writeText(investment._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 1. Loading State
  if (isLoading) {
    return <InvestmentDetailSkeleton />;
  }

  // 2. 404 / Unauthorized / Not Found State
  if (error?.status === 404 || (!isLoading && !investment && !error)) {
    return (
      <div className="space-y-6">
        <Link
          to="/investments"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Investments</span>
        </Link>

        <div className="bg-surface-card border border-border-subtle rounded-card p-8">
          <EmptyState
            icon={AlertCircle}
            title="Investment Not Found"
            description="The requested investment contract does not exist or does not belong to your account. Access to another user's financial contracts is strictly forbidden."
            actionText="Return to Portfolio"
            onAction={() => navigate('/investments')}
          />
        </div>
      </div>
    );
  }

  // 3. General Error State
  if (error) {
    return (
      <div className="space-y-6">
        <Link
          to="/investments"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Investments</span>
        </Link>

        <ErrorMessage
          title="Could Not Load Investment Details"
          message={
            error?.data?.message ||
            error?.message ||
            'Failed to retrieve investment details from the server.'
          }
          errors={error?.data?.errors}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/investments"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Investments Portfolio</span>
        </Link>

        {isFetching && (
          <span className="text-xs text-brand-primary animate-pulse font-mono">
            Refreshing...
          </span>
        )}
      </div>

      {/* Page Header */}
      <PageHeader
        title={`${investment.planName || 'Investment'} Package`}
        subtitle={
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-text-secondary">
            <span className="break-all">Reference ID: {investment._id}</span>
            <button
              type="button"
              onClick={handleCopyId}
              className="text-text-muted hover:text-text-primary transition-colors p-1 shrink-0"
              title="Copy Investment ID"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-brand-primary" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        }
        actions={<StatusBadge status={investment.status} />}
      />

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Principal Amount */}
        <div className="bg-surface-card border border-border-subtle rounded-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Principal Amount
            </span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-button">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight text-text-primary tabular-nums">
            {formatPaiseToINR(investment.principalAmountPaise)}
          </div>
          <p className="mt-1 text-xs text-text-muted">
            Locked capital allocation
          </p>
        </div>

        {/* Metric 2: Total ROI Generated */}
        <div className="bg-surface-card border border-border-subtle rounded-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Total ROI Generated
            </span>
            <div className="p-2 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-button">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight text-brand-primary tabular-nums">
            {formatPaiseToINR(investment.totalRoiEarnedPaise || 0)}
          </div>
          <p className="mt-1 text-xs text-text-muted">
            Credited to available wallet
          </p>
        </div>

        {/* Metric 3: Daily Rate */}
        <div className="bg-surface-card border border-border-subtle rounded-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Daily Yield Rate
            </span>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-button">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight text-cyan-400 tabular-nums">
            {Number(investment.roiPercentage).toFixed(2)}%
          </div>
          <p className="mt-1 text-xs text-text-muted">
            Server-authoritative rate
          </p>
        </div>

        {/* Metric 4: Lifecycle Status */}
        <div className="bg-surface-card border border-border-subtle rounded-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Contract Lifecycle
            </span>
            <div className="p-2 bg-surface-elevated text-text-secondary border border-border-subtle rounded-button">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight text-text-primary capitalize">
            {investment.status}
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {investment.status === 'active'
              ? 'Accruing daily dividends'
              : investment.status === 'pending'
              ? 'Awaiting administrative review'
              : investment.status === 'completed'
              ? 'Matured contract'
              : 'Cancelled / rejected request'}
          </p>
        </div>
      </div>

      {/* Lifecycle Status Banner */}
      {investment.status === 'pending' && (
        <div className="bg-pending/10 border border-pending/30 rounded-card p-4 flex items-start gap-3 text-xs text-pending">
          <Clock className="w-5 h-5 text-pending shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-300">
              Request Awaiting Administrative Review
            </p>
            <p className="text-amber-200/90 leading-relaxed">
              This investment request was logged on {formatDateTime(investment.createdAt)} and is queued for verification. This application is unfunded and no wallet balance was debited upon submission. In accordance with platform governance, daily returns do not accrue until the contract is administratively verified and activated.
            </p>
          </div>
        </div>
      )}

      {investment.status === 'cancelled' && (
        <div className="bg-danger/10 border border-danger/30 rounded-card p-4 flex items-start gap-3 text-xs text-danger">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-300">
              Contract Cancelled / Rejected
            </p>
            <p className="text-rose-200/90 leading-relaxed">
              {investment.rejectionReason
                ? `Administrative Decision: "${investment.rejectionReason}"`
                : 'This investment request was rejected or cancelled prior to contract execution.'}
              {investment.actionedAt && (
                <span className="block mt-1 text-[11px] text-rose-300/80">
                  Decision recorded on: {formatDateTime(investment.actionedAt)}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Contract & Lifecycle Details */}
      <div className="bg-surface-card border border-border-subtle rounded-card overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 bg-surface-elevated/40">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-primary shrink-0" />
            <h2 className="text-sm font-semibold text-text-primary">
              Contract Specifications & Dates
            </h2>
          </div>
          <span className="text-[11px] text-text-secondary font-mono">
            Asia/Kolkata Business Dates
          </span>
        </div>

        <div className="divide-y divide-border-subtle text-xs">
          <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-text-secondary font-medium">Investment Reference</span>
            <span className="text-text-primary font-mono font-medium break-all">{investment._id}</span>
          </div>

          <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-text-secondary font-medium">Plan Name</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
              {investment.planName}
            </span>
          </div>

          <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-text-secondary font-medium">Contract Start Date</span>
            <span className="text-text-primary font-medium">
              {investment.status === 'pending' ? (
                <span className="text-pending italic">Pending administrative activation</span>
              ) : investment.status === 'cancelled' ? (
                <span className="text-text-muted italic">Not activated</span>
              ) : (
                formatBusinessDate(investment.startDate || investment.createdAt)
              )}
            </span>
          </div>

          <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-text-secondary font-medium">Contract End Date</span>
            <span className="text-text-primary font-medium">
              {investment.status === 'pending' ? (
                <span className="text-pending italic">Scheduled upon contract activation</span>
              ) : investment.status === 'cancelled' ? (
                <span className="text-text-muted italic">Not applicable</span>
              ) : investment.endDate ? (
                formatBusinessDate(investment.endDate)
              ) : (
                <span className="text-text-muted italic">Ongoing / Indefinite Contract</span>
              )}
            </span>
          </div>

          <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-text-secondary font-medium">Created Timestamp</span>
            <span className="text-text-primary">
              {formatDateTime(investment.createdAt)}
            </span>
          </div>

          <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-text-secondary font-medium">Last Record Update</span>
            <span className="text-text-primary">
              {formatDateTime(investment.updatedAt)}
            </span>
          </div>

          {investment.actionedAt && (
            <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span className="text-text-secondary font-medium">Administrative Decision Date</span>
              <span className="text-text-primary font-medium">
                {formatDateTime(investment.actionedAt)}
              </span>
            </div>
          )}

          {investment.rejectionReason && (
            <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span className="text-text-secondary font-medium">Rejection Reason</span>
              <span className="text-danger font-medium max-w-md text-right">
                {investment.rejectionReason}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Governance & Security Disclaimer */}
      <div className="bg-surface-card border border-border-subtle rounded-card p-5 flex items-start gap-3.5 text-xs text-text-secondary">
        <ShieldCheck className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-text-primary">
            Server-Authoritative Contract Governance
          </p>
          <p className="leading-relaxed">
            All daily yields are calculated and credited via automated server batch jobs based on verified business dates. Contract terms, percentages, and balances are immutable and cryptographically bound to your account ID.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvestmentDetailPage;
