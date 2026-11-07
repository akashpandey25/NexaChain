import React, { useState, useEffect } from 'react';
import {
  useGetInvestmentPlansQuery,
  useCreateInvestmentMutation
} from '../investmentApi';
import {
  X,
  PiggyBank,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Percent,
  Calendar
} from 'lucide-react';
import { formatIndianNumber } from '../../../utils/formatters';

/**
 * Create Investment Modal Component
 * 
 * Accessible, restrained fintech modal allowing authenticated users to select
 * an authorized server-side investment package and allocate capital in integer paise.
 * 
 * @param {object} props
 * @param {boolean} props.isOpen Controls modal visibility
 * @param {Function} props.onClose Callback invoked when closing modal
 */
export const CreateInvestmentModal = ({ isOpen, onClose }) => {
  const { data: plans = [], isLoading: isPlansLoading, error: plansError } =
    useGetInvestmentPlansQuery(undefined, { skip: !isOpen });

  const [createInvestment, { isLoading: isSubmitting }] = useCreateInvestmentMutation();

  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Set default plan once plans are loaded
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].name || plans[0].id);
    }
  }, [plans, selectedPlanId]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amountRupees);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  const calculatedPaise = isValidAmount ? Math.round(parsedAmount * 100) : 0;

  const selectedPlanObj = plans.find(
    (p) => p.name === selectedPlanId || p.id === selectedPlanId
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedPlanId) {
      setFormError('Please select an investment package.');
      return;
    }

    if (!isValidAmount || calculatedPaise <= 0) {
      setFormError('Please enter a valid investment amount greater than zero.');
      return;
    }

    try {
      await createInvestment({
        planName: selectedPlanObj?.name || selectedPlanId,
        principalAmountPaise: calculatedPaise
      }).unwrap();

      setFormSuccess(true);
      setTimeout(() => {
        setFormSuccess(false);
        setAmountRupees('');
        onClose();
      }, 1200);
    } catch (err) {
      const errorMsg =
        err?.data?.message ||
        err?.message ||
        'Failed to submit investment request. Please try again.';
      setFormError(errorMsg);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-canvas/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-investment-title"
    >
      <div className="relative w-full max-w-lg bg-surface-card border border-border-strong rounded-card shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-elevated/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-button">
              <PiggyBank className="w-4 h-4" />
            </div>
            <div>
              <h2 id="create-investment-title" className="text-sm font-semibold text-text-primary">
                Request New Investment Contract
              </h2>
              <p className="text-[11px] text-text-secondary">
                Submit an intended capital allocation (unfunded, awaiting administrative review)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-text-muted hover:text-text-primary p-1.5 rounded-button hover:bg-surface-hover transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error Message */}
          {formError && (
            <div className="p-3.5 rounded-card bg-danger/10 border border-danger/30 text-danger text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Success Notification */}
          {formSuccess && (
            <div className="p-3.5 rounded-card bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Investment request submitted successfully in pending status.</span>
            </div>
          )}

          {/* Demonstration & Funding Notice */}
          <div className="p-3.5 rounded-card bg-pending/10 border border-pending/30 text-pending text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-pending shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-300">Unfunded Application & Testing Configuration Notice</p>
              <p className="text-amber-200/90 text-[11px] leading-relaxed">
                Stated packages and daily yields reflect technical testing defaults. Submitting this request registers an intended contract in <strong className="text-amber-100 font-semibold">pending</strong> status. <strong className="text-amber-100 font-semibold">No wallet balance is debited or transferred at this time.</strong> Contract activation and yield accrual occur strictly upon administrative verification.
              </p>
            </div>
          </div>

          {/* Package Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Select Investment Plan
            </label>

            {isPlansLoading ? (
              <div className="py-4 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                <span>Loading available server plans...</span>
              </div>
            ) : plansError ? (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded-card text-xs text-danger">
                Failed to load server plans. Please refresh and try again.
              </div>
            ) : (
              <div className="space-y-2">
                {plans.map((plan) => {
                  const isSelected =
                    selectedPlanId === plan.name || selectedPlanId === plan.id;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => !isSubmitting && setSelectedPlanId(plan.name || plan.id)}
                      className={`cursor-pointer p-3.5 rounded-card border transition-all text-xs flex items-center justify-between ${
                        isSelected
                          ? 'bg-brand-primary/10 border-brand-primary/60 shadow-sm'
                          : 'bg-surface-card border-border-subtle hover:border-border-strong hover:bg-surface-hover'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-text-primary">{plan.name}</span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded border border-brand-primary/20">
                            <Percent className="w-2.5 h-2.5" />
                            {Number(plan.roiPercentage).toFixed(1)}% Daily
                          </span>
                        </div>
                        <p className="text-[11px] text-text-secondary">{plan.description}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
                          <Calendar className="w-3 h-3 text-text-muted" />
                          {plan.durationDays} Days
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Amount Input in Rupees */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="investment-amount" className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Investment Principal (₹ INR)
              </label>
              {calculatedPaise > 0 && (
                <span className="text-[11px] font-mono tabular-nums text-brand-primary font-medium">
                  {formatIndianNumber(calculatedPaise)} Paise
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted font-semibold text-sm">
                ₹
              </span>
              <input
                id="investment-amount"
                type="number"
                step="any"
                min="1"
                disabled={isSubmitting}
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                placeholder="e.g. 10000"
                className="w-full pl-8 pr-4 py-2.5 bg-surface-canvas border border-border-subtle focus:border-brand-primary focus:ring-1 focus:ring-brand-primary rounded-input text-text-primary text-sm placeholder:text-text-muted transition-colors disabled:opacity-50"
              />
            </div>
            <p className="text-[11px] text-text-secondary">
              Enter intended allocation in Indian Rupees (recorded with exact integer paise precision). No funds are debited from your wallet during request submission.
            </p>
          </div>

          {/* Form Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-button text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValidAmount || !selectedPlanId}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-button text-xs font-semibold bg-brand-primary hover:bg-brand-hover active:bg-emerald-700 text-brand-primary-foreground shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <span>Submit Investment Request</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInvestmentModal;
