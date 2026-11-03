import React, { useState } from 'react';
import { Copy, Check, Share2, Link as LinkIcon, ShieldCheck, AlertCircle } from 'lucide-react';

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
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-center gap-3 text-slate-400 text-xs">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <span className="font-semibold text-white block">Referral Code Unavailable</span>
          <span>Your account does not currently have an assigned referral code. Contact system support to initialize your affiliate identity.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 sm:p-6 transition-all shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left: Code info */}
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
              <Share2 className="w-3 h-3" />
              Affiliate Program
            </span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            Invite Partners & Expand Your Network
          </h2>

          <p className="text-xs text-slate-400 leading-relaxed">
            Share your unique referral code or link with your affiliates. New accounts registering with your code will be permanently mapped to your multi-tier downline.
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
          {/* Referral Code Box */}
          <div className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Referral Code
              </span>
              <span className="text-lg font-mono font-bold text-white tracking-wider">
                {referralCode}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              title="Copy referral code"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Referral Link Box */}
          <div className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5">
            <div className="truncate max-w-[200px] sm:max-w-[240px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Registration Link
              </span>
              <span className="text-xs font-mono text-slate-400 truncate block">
                {registrationUrl}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shrink-0 shadow-sm shadow-emerald-950"
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

