import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh pending requests"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-emerald-400' : ''}`}
            />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Global Action Feedback Banners */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Pending Count */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Requests
            </span>
            <div className="p-2 bg-amber-950/60 text-amber-400 border border-amber-800/40 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-white">
            {pagination.totalRecords !== undefined ? pagination.totalRecords : investments.length}
          </div>
          <p className="mt-1 text-xs text-slate-400">Awaiting administrative decision</p>
        </div>

        {/* Metric 2: Pending Volume */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Capital Volume
            </span>
            <div className="p-2 bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-white">
            {formatPaiseToINR(totalPendingPaise)}
          </div>
          <p className="mt-1 text-xs text-slate-400">Total requested principal across list</p>
        </div>

        {/* Metric 3: Policy Status */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Production Activation Gate
            </span>
            <div className="p-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg">
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="mt-3 text-sm font-semibold text-amber-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Policy Guard Active</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Activation gated by INVESTMENT_ACTIVATION_ENABLED
          </p>
        </div>
      </div>

      {/* Production Safety Notice Banner */}
      <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4.5 flex items-start gap-3.5 text-xs text-amber-300">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-200">
            Production Safety Gate & Corporate Governance Notice
          </p>
          <p className="text-amber-400/90 leading-relaxed">
            The investment packages (Starter 1.0%, Growth 1.5%, Premium 2.0%) represent illustrative technical testing defaults. In production deployments with <strong className="font-mono text-amber-300">INVESTMENT_ACTIVATION_ENABLED=false</strong>, activation attempts will be blocked with policy errors to prevent unratified yield accrual. Rejections and request inspections remain fully operational.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          <span>Loading pending investment requests...</span>
        </div>
      ) : error ? (
        <ErrorMessage
          title="Could Not Load Pending Requests"
          message={error?.data?.message || error?.message || 'Failed to retrieve administrative listings.'}
          onRetry={refetch}
        />
      ) : investments.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8">
          <EmptyState
            icon={ShieldCheck}
            title="No Pending Investment Requests"
            description="All submitted investor requests have been reviewed and processed. New investor capital submissions will appear here for administrative verification."
          />
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {investments.map((inv) => {
                  const investorName = inv.user?.name || 'Unknown User';
                  const investorEmail = inv.user?.email || '—';
                  const investorMobile = inv.user?.mobileNumber || '—';

                  return (
                    <tr key={inv._id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Investor Column */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{investorName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{investorEmail}</span>
                          </div>
                          {investorMobile !== '—' && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-600" />
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
                          <div className="text-[11px] text-emerald-400 font-medium">
                            {Number(inv.roiPercentage).toFixed(1)}% Daily
                          </div>
                        </div>
                      </td>

                      {/* Principal Amount */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-semibold text-white">
                          {formatPaiseToINR(inv.principalAmountPaise)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {formatIndianNumber(inv.principalAmountPaise)} paise
                        </div>
                      </td>

                      {/* Submission Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-300">
                        <div>{formatBusinessDate(inv.createdAt)}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {formatDateTime(inv.createdAt)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/70 text-amber-400 border border-amber-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>PENDING</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                        {/* Inspect */}
                        <button
                          type="button"
                          onClick={() => setInspectItem(inv)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
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
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:text-white bg-emerald-950/40 hover:bg-emerald-600 border border-emerald-800/50 hover:border-emerald-600 transition-all"
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
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-600 border border-rose-800/50 hover:border-rose-600 transition-all"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Investment Request Specifications</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs divide-y divide-slate-800/60">
              <div className="flex items-center justify-between pb-3">
                <span className="text-slate-400">Request Reference ID</span>
                <span className="font-mono text-white flex items-center gap-1.5">
                  <span>{inspectItem._id}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyId(inspectItem._id)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    {copiedId === inspectItem._id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400">Applicant Name</span>
                <span className="text-white font-semibold">{inspectItem.user?.name || '—'}</span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400">Applicant Email</span>
                <span className="text-slate-200">{inspectItem.user?.email || '—'}</span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400">Mobile Number</span>
                <span className="font-mono text-slate-200">{inspectItem.user?.mobileNumber || 'Not Provided'}</span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400">Referral Code</span>
                <span className="font-mono text-indigo-400">{inspectItem.user?.referralCode || '—'}</span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400">Selected Plan</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-950/70 text-indigo-300 border border-indigo-800/50">
                  {inspectItem.planName}
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400">Daily Return Rate</span>
                <span className="text-emerald-400 font-semibold">{Number(inspectItem.roiPercentage).toFixed(2)}% Daily</span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400">Principal Commitment</span>
                <span className="text-white font-bold text-sm">{formatPaiseToINR(inspectItem.principalAmountPaise)}</span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400">Submission Timestamp</span>
                <span className="text-slate-300">{formatDateTime(inspectItem.createdAt)}</span>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-950/50 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Confirm Contract Activation</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActivateTarget(null);
                  setActionError(null);
                }}
                disabled={isActivating}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {actionError && (
                <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              <p className="text-slate-300 leading-relaxed">
                Are you sure you want to activate the <strong className="text-white">{activateTarget.planName}</strong> contract for investor <strong className="text-white">{activateTarget.user?.name || 'User'}</strong> with principal amount of <strong className="text-emerald-400">{formatPaiseToINR(activateTarget.principalAmountPaise)}</strong>?
              </p>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Start Date:</span>
                  <span className="text-slate-200">Immediate (Now)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Daily Yield:</span>
                  <span className="text-emerald-400 font-semibold">{Number(activateTarget.roiPercentage).toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Scheduler Policy:</span>
                  <span className="text-slate-200">Accrues midnight IST (00:00)</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-950/50 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setActivateTarget(null);
                  setActionError(null);
                }}
                disabled={isActivating}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmActivation}
                disabled={isActivating}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-semibold text-white">Reject Investment Request</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRejectTarget(null);
                  setActionError(null);
                }}
                disabled={isRejecting}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {actionError && (
                <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              <p className="text-slate-300 leading-relaxed">
                Rejecting this request will mark the contract as <strong className="text-rose-400 font-semibold">cancelled</strong>. Provide an auditable explanation for the investor and administrative logs:
              </p>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase">
                  Rejection Reason (Required)
                </label>
                <textarea
                  rows={3}
                  disabled={isRejecting}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Identity verification pending; KYC document mismatch; capital allocation threshold exceeded..."
                  className="w-full p-3 bg-slate-950/70 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl text-white text-xs placeholder:text-slate-600 transition-colors disabled:opacity-50"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Minimum 3 characters</span>
                  <span>{rejectionReason.length}/500</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-950/50 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setRejectTarget(null);
                  setActionError(null);
                }}
                disabled={isRejecting}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                disabled={isRejecting || rejectionReason.trim().length < 3}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
