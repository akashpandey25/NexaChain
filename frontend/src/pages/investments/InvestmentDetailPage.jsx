import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useGetInvestmentByIdQuery } from '../../features/investments/investmentApi';
import { InvestmentDetailSkeleton } from '../../features/investments/components/InvestmentDetailSkeleton';
import {
  formatPaiseToINR,
  formatBusinessDate,
  formatDateTime,
  getStatusStyle
} from '../../utils/formatters';
import {
  ArrowLeft,
  PiggyBank,
  TrendingUp,
  Percent,
  ShieldCheck,
  Calendar,
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
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Investments</span>
        </Link>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8">
          <EmptyState
            icon={AlertCircle}
            title="Investment Not Found"
            description="The requested investment contract does not exist or does not belong to your account. Access to another user's financial contracts is strictly forbidden."
            actionText="Return to Portfolio"
            onAction={() => window.location.assign('/investments')}
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
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
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

  const statusStyle = getStatusStyle(investment.status);

  return (
    <div className="space-y-6">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/investments"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Investments Portfolio</span>
        </Link>

        {isFetching && (
          <span className="text-xs text-emerald-400 animate-pulse font-mono">
            Refreshing...
          </span>
        )}
      </div>

      {/* Page Header */}
      <PageHeader
        title={`${investment.planName || 'Investment'} Package`}
        subtitle={
          <span className="inline-flex items-center gap-2 font-mono text-xs text-slate-400">
            <span>Reference ID: {investment._id}</span>
            <button
              type="button"
              onClick={handleCopyId}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1"
              title="Copy Investment ID"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </span>
        }
        actions={
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusStyle.badge}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
            {statusStyle.label}
          </span>
        }
      />

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Principal Amount */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Principal Amount
            </span>
            <div className="p-2 bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 rounded-lg">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-white">
            {formatPaiseToINR(investment.principalAmountPaise)}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Locked capital allocation
          </p>
        </div>

        {/* Metric 2: Total ROI Generated */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total ROI Generated
            </span>
            <div className="p-2 bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-emerald-400">
            {formatPaiseToINR(investment.totalRoiEarnedPaise || 0)}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Credited to available wallet
          </p>
        </div>

        {/* Metric 3: Daily Rate */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Daily Yield Rate
            </span>
            <div className="p-2 bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 rounded-lg">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-cyan-400">
            {Number(investment.roiPercentage).toFixed(2)}%
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Server-authoritative rate
          </p>
        </div>

        {/* Metric 4: Lifecycle Status */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Contract Lifecycle
            </span>
            <div className="p-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-white capitalize">
            {investment.status}
          </div>
          <p className="mt-1 text-xs text-slate-400">
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
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4.5 flex items-start gap-3 text-xs text-amber-300">
          <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-200">
              Request Awaiting Administrative Review
            </p>
            <p className="text-amber-400/90 leading-relaxed">
              This investment request was logged on {formatDateTime(investment.createdAt)} and is queued for verification. This application is unfunded and no wallet balance was debited upon submission. In accordance with platform governance, daily returns do not accrue until the contract is administratively verified and activated.
            </p>
          </div>
        </div>
      )}

      {investment.status === 'cancelled' && (
        <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-4.5 flex items-start gap-3 text-xs text-rose-300">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-200">
              Contract Cancelled / Rejected
            </p>
            <p className="text-rose-400/90 leading-relaxed">
              {investment.rejectionReason
                ? `Administrative Decision: "${investment.rejectionReason}"`
                : 'This investment request was rejected or cancelled prior to contract execution.'}
              {investment.actionedAt && (
                <span className="block mt-1 text-[11px] text-rose-400/80">
                  Decision recorded on: {formatDateTime(investment.actionedAt)}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Contract & Lifecycle Details */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">
              Contract Specifications & Dates
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Asia/Kolkata Business Dates
          </span>
        </div>

        <div className="divide-y divide-slate-800/60 text-xs">
          <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-slate-400 font-medium">Investment Reference</span>
            <span className="text-white font-mono font-medium">{investment._id}</span>
          </div>

          <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-slate-400 font-medium">Plan Name</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-950/70 text-indigo-300 border border-indigo-800/50 w-fit">
              {investment.planName}
            </span>
          </div>

          <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-slate-400 font-medium">Contract Start Date</span>
            <span className="text-slate-200 font-medium">
              {formatBusinessDate(investment.startDate || investment.createdAt)}
            </span>
          </div>

          <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-slate-400 font-medium">Contract End Date</span>
            <span className="text-slate-200 font-medium">
              {investment.endDate ? (
                formatBusinessDate(investment.endDate)
              ) : (
                <span className="text-slate-400 italic">Ongoing / Indefinite Contract</span>
              )}
            </span>
          </div>

          <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-slate-400 font-medium">Created Timestamp</span>
            <span className="text-slate-300">
              {formatDateTime(investment.createdAt)}
            </span>
          </div>

          <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-slate-400 font-medium">Last Record Update</span>
            <span className="text-slate-300">
              {formatDateTime(investment.updatedAt)}
            </span>
          </div>

          {investment.actionedAt && (
            <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span className="text-slate-400 font-medium">Administrative Decision Date</span>
              <span className="text-slate-200 font-medium">
                {formatDateTime(investment.actionedAt)}
              </span>
            </div>
          )}

          {investment.rejectionReason && (
            <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span className="text-slate-400 font-medium">Rejection Reason</span>
              <span className="text-rose-400 font-medium max-w-md text-right">
                {investment.rejectionReason}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Governance & Security Disclaimer */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 flex items-start gap-3.5 text-xs text-slate-400">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-300">
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
