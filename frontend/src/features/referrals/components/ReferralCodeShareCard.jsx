import React, { useState } from 'react';
import { Copy, Check, Share2, Link as LinkIcon, AlertCircle } from 'lucide-react';

/**
 * Referral Code and Sharing Card Component
 * Displays user's referral code, generated registration link, and copy actions.
 * 
 * @param {object} props
 * @param {string} [props.referralCode] Authenticated user's referral code
 */
export const ReferralCodeShareCard = ({ referralCode }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const registrationUrl = referralCode
    ? `${window.location.origin}/register?ref=${referralCode}`
    : '';

  const handleCopyCode = () => {
    if (!referralCode) return;
    navigator.clipboard?.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!registrationUrl) return;
    navigator.clipboard?.writeText(registrationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!referralCode) {
    return (
      <div className="bg-surface-card border border-border-subtle rounded-card p-5 flex items-center gap-3 text-text-secondary text-xs shadow-sm">
        <AlertCircle className="w-5 h-5 text-pending shrink-0" />
        <div>
          <span className="font-semibold text-text-primary block">Referral Code Unavailable</span>
          <span>Your account does not currently have an assigned referral code. Contact system support to initialize your affiliate identity.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-card border border-border-subtle rounded-card p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left: Code info */}
        <div className="space-y-2 max-w-xl min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-2.5 py-0.5 rounded-full border border-brand-primary/20">
              <Share2 className="w-3 h-3" />
              Affiliate Program
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
            Invite Affiliates & Expand Your Network
          </h2>

          <p className="text-xs text-text-secondary leading-relaxed">
            Share your personal referral code or registration link with prospective affiliates. New accounts registering with your code are mapped directly to your affiliate network.
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col gap-3 min-w-0 w-full lg:w-80 shrink-0">
          {/* Referral Code Box */}
          <div className="flex items-center justify-between gap-3 bg-surface-canvas border border-border-subtle rounded-card px-4 py-2.5 min-w-0">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-semibold text-text-muted block tracking-wider">
                Referral Code
              </span>
              <span className="text-base sm:text-lg font-mono font-bold text-text-primary tracking-wider">
                {referralCode}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium bg-surface-elevated hover:bg-surface-hover text-text-primary border border-border-subtle transition-colors shrink-0"
              title="Copy referral code"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-brand-primary" />
                  <span className="text-brand-primary font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Referral Link Box */}
          <div className="flex items-center justify-between gap-3 bg-surface-canvas border border-border-subtle rounded-card px-4 py-2.5 min-w-0">
            <div className="truncate min-w-0 flex-1 mr-2">
              <span className="text-[10px] uppercase font-semibold text-text-muted block tracking-wider">
                Registration Link
              </span>
              <span className="text-xs font-mono text-text-secondary truncate block">
                {registrationUrl}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-semibold bg-brand-primary hover:bg-brand-hover active:bg-emerald-700 text-brand-primary-foreground transition-all shrink-0 shadow-sm"
              title="Copy registration link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralCodeShareCard;
