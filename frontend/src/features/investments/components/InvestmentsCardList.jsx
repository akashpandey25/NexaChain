import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Copy,
  Check,
  Percent
} from 'lucide-react';
import {
  formatPaiseToINR,
  formatBusinessDate
} from '../../../utils/formatters';
import { StatusBadge } from '../../../components/common/StatusBadge';

/**
 * Mobile Investment Listing Card View Component
 * Renders individual cards optimized for touch screens.
 * 
 * @param {object} props
 * @param {Array} props.investments List of investment objects
 */
export const InvestmentsCardList = ({ investments = [] }) => {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-3 md:hidden">
      {investments.map((inv) => {
        const shortId = inv._id ? `${inv._id.slice(0, 6)}...${inv._id.slice(-4)}` : '—';
        const isCopied = copiedId === inv._id;

        return (
          <div
            key={inv._id}
            className="bg-surface-card border border-border-subtle hover:border-border-strong rounded-card p-4 transition-all shadow-sm flex flex-col justify-between"
          >
            {/* Top Row: Plan & Status */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-surface-elevated text-text-primary border border-border-subtle">
                {inv.planName || 'STANDARD'}
              </span>
              <StatusBadge status={inv.status} size="sm" />
            </div>

            {/* Principal & Yield */}
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <span className="text-[11px] font-medium text-text-muted block">
                  Principal Amount
                </span>
                <span className="text-xl font-bold text-text-primary tracking-tight font-sans font-tabular tabular-nums">
                  {formatPaiseToINR(inv.principalAmountPaise)}
                </span>
                {typeof inv.totalRoiEarnedPaise === 'number' && inv.totalRoiEarnedPaise > 0 && (
                  <span className="text-[10px] text-semantic-positive font-tabular tabular-nums block mt-0.5">
                    +{formatPaiseToINR(inv.totalRoiEarnedPaise)} earned
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 font-semibold text-semantic-positive bg-semantic-positive/10 px-2 py-0.5 rounded text-xs border border-semantic-positive/30 font-sans font-tabular tabular-nums">
                  <Percent className="w-3 h-3" />
                  {Number(inv.roiPercentage).toFixed(2)}% Daily
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-t border-b border-border-subtle text-text-muted">
              <div>
                <span className="text-[10px] text-text-muted block uppercase">
                  Start Date
                </span>
                <span className="text-text-secondary font-medium">
                  {inv.status === 'pending'
                    ? 'Pending Activation'
                    : inv.status === 'cancelled'
                    ? 'Not Activated'
                    : formatBusinessDate(inv.startDate || inv.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted block uppercase">
                  End Date
                </span>
                <span className="text-text-secondary font-medium">
                  {inv.status === 'pending'
                    ? 'Pending Activation'
                    : inv.status === 'cancelled'
                    ? 'Not Applicable'
                    : inv.endDate
                    ? formatBusinessDate(inv.endDate)
                    : 'Ongoing'}
                </span>
              </div>
            </div>

            {/* Bottom: ID and Action Link */}
            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-text-muted">
                <span className="font-mono text-[11px]">{shortId}</span>
                <button
                  type="button"
                  onClick={(e) => handleCopy(inv._id, e)}
                  className="text-text-muted hover:text-text-primary p-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-semantic-focus rounded"
                  title="Copy ID"
                >
                  {isCopied ? (
                    <Check className="w-3 h-3 text-semantic-positive" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              <Link
                to={`/investments/${inv._id}`}
                className="inline-flex items-center gap-1 text-text-primary font-medium px-2.5 py-1 rounded-button bg-surface-elevated hover:bg-surface-card-hover border border-border-subtle transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-semantic-focus"
              >
                <span>View Details</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-text-muted" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InvestmentsCardList;
