import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, ArrowUpRight } from 'lucide-react';
import {
  formatPaiseToINR,
  formatBusinessDate
} from '../../../utils/formatters';
import { StatusBadge } from '../../../components/common/StatusBadge';

/**
 * Mobile Touch-Optimized ROI Card List Component
 * 
 * @param {object} props
 * @param {Array} props.records List of ROI history records
 */
export const RoiHistoryCardList = ({ records = [] }) => {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-3.5 md:hidden">
      {records.map((rec) => {
        const shortId = rec._id ? `${rec._id.slice(0, 6)}...${rec._id.slice(-4)}` : '—';
        const isCopied = copiedId === rec._id;
        const investment = rec.investment || {};

        return (
          <div
            key={rec._id}
            className="bg-surface-card border border-border-subtle rounded-card p-4 space-y-3 shadow-sm"
          >
            {/* Top row: Plan & Status */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {investment.planName || 'Contract'}
              </span>
              <StatusBadge status={rec.status} size="sm" />
            </div>

            {/* Middle: Business Date & Payout Yield */}
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider block">Business Date</span>
                <span className="text-base font-semibold text-text-primary">
                  {formatBusinessDate(rec.businessDate)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-text-muted uppercase tracking-wider block">Credited ROI</span>
                <span className="text-base font-bold text-semantic-positive font-tabular tabular-nums">
                  +{formatPaiseToINR(rec.amountPaise)}
                </span>
              </div>
            </div>

            {/* Grid Details */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border-subtle text-text-secondary">
              <div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider block">Applied Rate</span>
                <span className="text-text-primary font-medium tabular-nums">
                  {Number(rec.roiPercentageApplied).toFixed(2)}% Daily
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider block">Contract Principal</span>
                <span className="text-text-primary font-medium font-tabular tabular-nums">
                  {typeof investment.principalAmountPaise === 'number'
                    ? formatPaiseToINR(investment.principalAmountPaise)
                    : '—'}
                </span>
              </div>
            </div>

            {/* Bottom Row: ID & Investment Link */}
            <div className="flex items-center justify-between text-xs pt-1 text-text-secondary">
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span>{shortId}</span>
                <button
                  type="button"
                  onClick={(e) => handleCopy(rec._id, e)}
                  className="text-text-muted hover:text-text-primary p-0.5 rounded"
                  title="Copy reference ID"
                >
                  {isCopied ? (
                    <Check className="w-3 h-3 text-brand-primary" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              {investment._id && (
                <Link
                  to={`/investments/${investment._id}`}
                  className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  <span>View Contract</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RoiHistoryCardList;
