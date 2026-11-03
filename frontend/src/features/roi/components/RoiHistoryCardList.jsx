import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, ArrowUpRight, Percent } from 'lucide-react';
import {
  formatPaiseToINR,
  formatBusinessDate,
  formatDateTime,
  getStatusStyle
} from '../../../utils/formatters';

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
        const statusStyle = getStatusStyle(rec.status);
        const shortId = rec._id ? `${rec._id.slice(0, 6)}...${rec._id.slice(-4)}` : '—';
        const isCopied = copiedId === rec._id;
        const investment = rec.investment || {};

        return (
          <div
            key={rec._id}
            className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3 shadow-md"
          >
            {/* Top row: Plan & Status */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/50">
                {investment.planName || 'Contract'}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusStyle.badge}`}
              >
                <span className={`w-1 h-1 rounded-full ${statusStyle.dot}`} />
                {statusStyle.label}
              </span>
            </div>

            {/* Middle: Business Date & Payout Yield */}
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Business Date</span>
                <span className="text-base font-bold text-white">
                  {formatBusinessDate(rec.businessDate)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block">ROI Yield</span>
                <span className="text-base font-bold text-emerald-400">
                  +{formatPaiseToINR(rec.amountPaise)}
                </span>
              </div>
            </div>

            {/* Grid Details */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/70 text-slate-400">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Applied Rate</span>
                <span className="text-slate-300 font-medium">
                  {Number(rec.roiPercentageApplied).toFixed(2)}% Daily
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Principal</span>
                <span className="text-slate-300 font-medium">
                  {typeof investment.principalAmountPaise === 'number'
                    ? formatPaiseToINR(investment.principalAmountPaise)
                    : '—'}
                </span>
              </div>
            </div>

            {/* Bottom Row: ID & Investment Link */}
            <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span>{shortId}</span>
                <button
                  type="button"
                  onClick={(e) => handleCopy(rec._id, e)}
                  className="text-slate-500 hover:text-slate-300"
                  title="Copy ID"
                >
                  {isCopied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
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
                  <span>View Package</span>
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

