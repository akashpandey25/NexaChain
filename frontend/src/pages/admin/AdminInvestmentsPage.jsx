import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';
import { EmptyState } from '../../components/feedback/EmptyState';
import {
  useGetAdminPendingInvestmentsQuery,
  useActivateInvestmentMutation,
  useRejectInvestmentMutation
} from '../../features/investments/investmentApi';
import {
  formatPaiseToINR,
  formatDateTime,
  formatBusinessDate,
  formatIndianNumber
} from '../../utils/formatters';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Check,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  Eye,
  User,
  Mail,
  Phone,
  RefreshCw,
  FileText,
  Copy,
  Loader2,
  Lock,
  Percent,
  Calendar
} from 'lucide-react';

/**
 * Admin Pending Investments Management Page
 * Allows authenticated administrators to inspect, activate, or reject investor requests.
 * Respects INVESTMENT_ACTIVATION_ENABLED safety gate and self-approval prevention.
 */
export const AdminInvestmentsPage = () => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const {
    data: pendingData,
    isLoading,
    isFetching,
    error,
    refetch
  } = useGetAdminPendingInvestmentsQuery({ page, limit });

  const [activateInvestment, { isLoading: isActivating }] = useActivateInvestmentMutation();
  const [rejectInvestment, { isLoading: isRejecting }] = useRejectInvestmentMutation();

  // Modal states
  const [inspectItem, setInspectItem] = useState(null);
  const [activateTarget, setActivateTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const investments = pendingData?.investments || [];
  const pagination = pendingData?.pagination || {};

  // Escape key listener for accessible modal dismissal
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isActivating && !isRejecting) {
        setInspectItem(null);
        setActivateTarget(null);
        setRejectTarget(null);
        setActionError(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActivating, isRejecting]);

  const handleCopyId = (id) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmActivation = async () => {
    if (!activateTarget) return;
    setActionError(null);

    try {
      await activateInvestment(activateTarget._id).unwrap();
      setActionSuccess(`Investment ${activateTarget._id} activated successfully.`);
      setActivateTarget(null);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError(
        err?.data?.message || err?.message || 'Failed to activate investment contract.'
      );
    }
  };

  const handleConfirmRejection = async () => {
    if (!rejectTarget) return;
    setActionError(null);

    if (!rejectionReason || rejectionReason.trim().length < 3) {
      setActionError('Please provide a rejection reason with at least 3 characters.');
      return;
    }

    try {
      await rejectInvestment({
        id: rejectTarget._id,
        reason: rejectionReason.trim()
      }).unwrap();

      setActionSuccess(`Investment ${rejectTarget._id} rejected successfully.`);
      setRejectTarget(null);
      setRejectionReason('');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError(
        err?.data?.message || err?.message || 'Failed to reject investment contract.'
      );
    }
  };

  const totalPendingPaise = investments.reduce(
    (sum, inv) => sum + (inv.principalAmountPaise || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Administrative Approvals"
        subtitle="Review investor capital allocation requests, inspect account verification, and action contract lifecycle decisions"
        actions={
          <button
            type="button"
            onClick={refetch}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium bg-surface-canvas border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors disabled:opacity-50"
            title="Refresh pending requests"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-brand-primary' : ''}`}
            />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Global Action Feedback Banners */}
      {actionSuccess && (
        <div className="p-4 rounded-card bg-semantic-positive/10 border border-semantic-positive/30 text-semantic-positive text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-semantic-positive shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-semantic-positive hover:opacity-80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Pending Count */}
        <div className="bg-surface-card border border-border-subtle rounded-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Pending Requests
            </span>
            <div className="p-2 bg-semantic-pending/10 text-semantic-pending border border-semantic-pending/20 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-text-primary font-tabular tabular-nums">
            {pagination.totalRecords !== undefined ? pagination.totalRecords : investments.length}
          </div>
          <p className="mt-1 text-xs text-text-secondary">Awaiting administrative decision</p>
        </div>

        {/* Metric 2: Pending Volume */}
        <div className="bg-surface-card border border-border-subtle rounded-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Pending Capital Volume
            </span>
            <div className="p-2 bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-text-primary font-tabular tabular-nums">
            {formatPaiseToINR(totalPendingPaise)}
          </div>
          <p className="mt-1 text-xs text-text-secondary">Total requested principal across list</p>
        </div>

        {/* Metric 3: Policy Status */}
        <div className="bg-surface-card border border-border-subtle rounded-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Production Activation Gate
            </span>
            <div className="p-2 bg-surface-elevated text-text-secondary border border-border-subtle rounded-lg">
              <Lock className="w-4 h-4 text-semantic-pending" />
            </div>
          </div>
          <div className="mt-3 text-sm font-semibold text-semantic-pending flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-semantic-pending" />
            <span>Policy Guard Active</span>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Activation gated by INVESTMENT_ACTIVATION_ENABLED
          </p>
        </div>
      </div>

      {/* Production Safety Notice Banner */}
      <div className="bg-semantic-pending/10 border border-semantic-pending/30 rounded-card p-4.5 flex items-start gap-3.5 text-xs text-semantic-pending">
        <ShieldAlert className="w-5 h-5 text-semantic-pending shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-text-primary">
            Production Safety Gate & Corporate Governance Notice
          </p>
          <p className="text-text-secondary leading-relaxed">
            The investment packages (Starter 1.0%, Growth 1.5%, Premium 2.0%) represent illustrative technical testing defaults. In production deployments with <strong className="font-mono text-text-primary">INVESTMENT_ACTIVATION_ENABLED=false</strong>, activation attempts will be blocked with policy errors to prevent unratified yield accrual. Rejections and request inspections remain fully operational.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-surface-card border border-border-subtle rounded-card p-12 text-center text-xs text-text-muted flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
          <span>Loading pending investment requests...</span>
        </div>
      ) : error ? (
        <ErrorMessage
          title="Could Not Load Pending Requests"
          message={error?.data?.message || error?.message || 'Failed to retrieve administrative listings.'}
          onRetry={refetch}
        />
      ) : investments.length === 0 ? (
        <div className="bg-surface-card border border-border-subtle rounded-card p-8">
          <EmptyState
            icon={ShieldCheck}
            title="No Pending Investment Requests"
            description="All submitted investor requests have been reviewed and processed. New investor capital submissions will appear here for administrative verification."
          />
        </div>
      ) : (
        <div className="bg-surface-card border border-border-subtle rounded-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-canvas/50 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  <th scope="col" className="px-5 py-3.5">
                    Investor
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Plan
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Principal Amount
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Requested Date
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs">
                {investments.map((inv) => {
                  const investorName = inv.user?.name || 'Unknown User';
                  const investorEmail = inv.user?.email || '—';
                  const investorMobile = inv.user?.mobileNumber || '—';

                  return (
                    <tr key={inv._id} className="hover:bg-surface-card-hover/40 transition-colors">
                      {/* Investor Column */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-text-primary flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-text-muted" />
                            <span>{investorName}</span>
                          </div>
                          <div className="text-[11px] text-text-secondary flex items-center gap-1">
                            <Mail className="w-3 h-3 text-text-muted" />
                            <span>{investorEmail}</span>
                          </div>
                          {investorMobile !== '—' && (
                            <div className="text-[11px] text-text-muted flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-text-muted" />
                              <span>{investorMobile}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Plan Column */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-950/70 text-indigo-300 border border-indigo-800/50">
                            {inv.planName}
                          </span>
                          <div className="text-[11px] text-brand-primary font-medium font-tabular tabular-nums">
                            {Number(inv.roiPercentage).toFixed(1)}% Daily
                          </div>
                        </div>
                      </td>

                      {/* Principal Amount */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-semibold text-text-primary font-tabular tabular-nums">
                          {formatPaiseToINR(inv.principalAmountPaise)}
                        </div>
                        <div className="text-[10px] text-text-muted font-mono">
                          {formatIndianNumber(inv.principalAmountPaise)} paise
                        </div>
                      </td>

                      {/* Submission Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-text-secondary">
                        <div className="font-tabular tabular-nums">{formatBusinessDate(inv.createdAt)}</div>
                        <div className="text-[10px] text-text-muted font-mono">
                          {formatDateTime(inv.createdAt)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status="pending" size="sm" />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                        {/* Inspect */}
                        <button
                          type="button"
                          onClick={() => setInspectItem(inv)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-button text-xs font-medium text-text-secondary hover:text-text-primary bg-surface-elevated hover:bg-surface-card-hover border border-border-subtle transition-colors"
                          title="Inspect application details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>

                        {/* Activate */}
                        <button
                          type="button"
                          onClick={() => {
                            setActionError(null);
                            setActivateTarget(inv);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-button text-xs font-medium text-brand-primary hover:text-brand-primary-foreground bg-brand-primary/10 hover:bg-brand-primary border border-brand-primary/30 transition-colors"
                          title="Activate contract"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Activate</span>
                        </button>

                        {/* Reject */}
                        <button
                          type="button"
                          onClick={() => {
                            setActionError(null);
                            setRejectionReason('');
                            setRejectTarget(inv);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-button text-xs font-medium text-semantic-danger hover:text-white bg-semantic-danger/10 hover:bg-semantic-danger border border-semantic-danger/30 transition-colors"
                          title="Reject contract"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1. INSPECT MODAL */}
      {inspectItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-canvas/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inspect-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectItem(null);
          }}
        >
          <div className="relative w-full max-w-lg bg-surface-card border border-border-subtle rounded-card shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-canvas/50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-primary" />
                <h3 id="inspect-dialog-title" className="text-sm font-semibold text-text-primary">Investment Request Specifications</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="text-text-muted hover:text-text-primary p-1 rounded-button"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs divide-y divide-border-subtle">
              <div className="flex items-center justify-between pb-3">
                <span className="text-text-secondary">Request Reference ID</span>
                <span className="font-mono text-text-primary flex items-center gap-1.5">
                  <span>{inspectItem._id}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyId(inspectItem._id)}
                    className="text-text-muted hover:text-text-primary"
                  >
                    {copiedId === inspectItem._id ? (
                      <Check className="w-3.5 h-3.5 text-brand-primary" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-text-secondary">Applicant Name</span>
                <span className="text-text-primary font-semibold">{inspectItem.user?.name || '—'}</span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-text-secondary">Applicant Email</span>
                <span className="text-text-secondary">{inspectItem.user?.email || '—'}</span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-text-secondary">Mobile Number</span>
                <span className="font-mono text-text-secondary">{inspectItem.user?.mobileNumber || 'Not Provided'}</span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-text-secondary">Referral Code</span>
                <span className="font-mono text-indigo-400">{inspectItem.user?.referralCode || '—'}</span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-text-secondary">Selected Plan</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-950/70 text-indigo-300 border border-indigo-800/50">
                  {inspectItem.planName}
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-text-secondary">Daily Return Rate</span>
                <span className="text-brand-primary font-semibold font-tabular tabular-nums">{Number(inspectItem.roiPercentage).toFixed(2)}% Daily</span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-text-secondary">Principal Commitment</span>
                <span className="text-text-primary font-bold text-sm font-tabular tabular-nums">{formatPaiseToINR(inspectItem.principalAmountPaise)}</span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-text-secondary">Submission Timestamp</span>
                <span className="text-text-secondary font-tabular tabular-nums">{formatDateTime(inspectItem.createdAt)}</span>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-surface-canvas/50 border-t border-border-subtle flex justify-end">
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="px-4 py-1.5 rounded-button text-xs font-medium bg-surface-elevated text-text-secondary hover:text-text-primary border border-border-subtle transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACTIVATION CONFIRMATION MODAL */}
      {activateTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-canvas/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="activate-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isActivating) {
              setActivateTarget(null);
              setActionError(null);
            }
          }}
        >
          <div className="relative w-full max-w-md bg-surface-card border border-border-subtle rounded-card shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-canvas/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-primary" />
                <h3 id="activate-dialog-title" className="text-sm font-semibold text-text-primary">Confirm Contract Activation</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActivateTarget(null);
                  setActionError(null);
                }}
                disabled={isActivating}
                className="text-text-muted hover:text-text-primary p-1 rounded-button"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {actionError && (
                <div className="p-3.5 rounded-card bg-semantic-danger/10 border border-semantic-danger/30 text-semantic-danger text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-semantic-danger shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              <p className="text-text-secondary leading-relaxed">
                Are you sure you want to activate the <strong className="text-text-primary">{activateTarget.planName}</strong> contract for investor <strong className="text-text-primary">{activateTarget.user?.name || 'User'}</strong> with principal amount of <strong className="text-brand-primary font-tabular tabular-nums">{formatPaiseToINR(activateTarget.principalAmountPaise)}</strong>?
              </p>

              <div className="p-3 rounded-card bg-surface-canvas border border-border-subtle space-y-1.5 text-[11px] text-text-secondary">
                <div className="flex items-center justify-between">
                  <span>Start Date:</span>
                  <span className="text-text-primary">Immediate (Now)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Daily Yield:</span>
                  <span className="text-brand-primary font-semibold font-tabular tabular-nums">{Number(activateTarget.roiPercentage).toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Scheduler Policy:</span>
                  <span className="text-text-primary">Accrues midnight IST (00:00)</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-surface-canvas/50 border-t border-border-subtle flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setActivateTarget(null);
                  setActionError(null);
                }}
                disabled={isActivating}
                className="px-4 py-2 rounded-button text-xs font-medium text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmActivation}
                disabled={isActivating}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-button text-xs font-semibold bg-brand-primary hover:bg-brand-hover text-brand-primary-foreground transition-all disabled:opacity-50"
              >
                {isActivating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Activating...</span>
                  </>
                ) : (
                  <span>Confirm Activation</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. REJECTION MODAL */}
      {rejectTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-canvas/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isRejecting) {
              setRejectTarget(null);
              setActionError(null);
            }
          }}
        >
          <div className="relative w-full max-w-md bg-surface-card border border-border-subtle rounded-card shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-canvas/50">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-semantic-danger" />
                <h3 id="reject-dialog-title" className="text-sm font-semibold text-text-primary">Reject Investment Request</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRejectTarget(null);
                  setActionError(null);
                }}
                disabled={isRejecting}
                className="text-text-muted hover:text-text-primary p-1 rounded-button"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {actionError && (
                <div className="p-3.5 rounded-card bg-semantic-danger/10 border border-semantic-danger/30 text-semantic-danger text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-semantic-danger shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              <p className="text-text-secondary leading-relaxed">
                Rejecting this request will mark the contract as <strong className="text-semantic-danger font-semibold">cancelled</strong>. Provide an auditable explanation for the investor and administrative logs:
              </p>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-text-secondary uppercase">
                  Rejection Reason (Required)
                </label>
                <textarea
                  rows={3}
                  disabled={isRejecting}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Incomplete application details; administrative review criteria not met; allocation threshold exceeded..."
                  className="w-full p-3 bg-surface-canvas border border-border-subtle focus:border-semantic-danger focus:ring-1 focus:ring-semantic-danger rounded-button text-text-primary text-xs placeholder:text-text-muted transition-colors disabled:opacity-50"
                />
                <div className="flex justify-between text-[10px] text-text-muted">
                  <span>Minimum 3 characters</span>
                  <span>{rejectionReason.length}/500</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-surface-canvas/50 border-t border-border-subtle flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setRejectTarget(null);
                  setActionError(null);
                }}
                disabled={isRejecting}
                className="px-4 py-2 rounded-button text-xs font-medium text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                disabled={isRejecting || rejectionReason.trim().length < 3}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-button text-xs font-semibold bg-semantic-danger hover:bg-semantic-danger/90 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <span>Confirm Rejection</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvestmentsPage;

