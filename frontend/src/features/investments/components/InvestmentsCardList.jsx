import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Copy,
  Check,
  Calendar,
  Percent,
  TrendingUp,
  Layers
} from 'lucide-react';
import {
  formatPaiseToINR,
  formatBusinessDate,
  getStatusStyle
} from '../../../utils/formatters';

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
    <div className="space-y-3.5 md:hidden">
      {investments.map((inv) => {
        const statusStyle = getStatusStyle(inv.status);
        const shortId = inv._id ? `${inv._id.slice(0, 6)}...${inv._id.slice(-4)}` : '—';
        const isCopied = copiedId === inv._id;

        return (
          <div
            key={inv._id}
            className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all shadow-md flex flex-col justify-between"
          >
            {/* Top Row: Plan & Status */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/50">
                {inv.planName || 'STANDARD'}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.badge}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                {statusStyle.label}
              </span>
            </div>

            {/* Principal & Yield */}
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">
                  Principal Amount
                </span>
                <span className="text-xl font-bold text-white tracking-tight">
                  {formatPaiseToINR(inv.principalAmountPaise)}
                </span>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded text-xs border border-emerald-800/40">
                  <Percent className="w-3 h-3" />
                  {Number(inv.roiPercentage).toFixed(2)}% Daily
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-t border-b border-slate-800/70 text-slate-400">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">
                  Start Date
                </span>
                <span className="text-slate-300 font-medium">
                  {formatBusinessDate(inv.startDate || inv.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">
                  End Date
                </span>
                <span className="text-slate-300 font-medium">
                  {inv.endDate ? formatBusinessDate(inv.endDate) : 'Ongoing'}
                </span>
              </div>
            </div>

            {/* Bottom: ID and Action Link */}
            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="font-mono text-[11px]">{shortId}</span>
                <button
                  type="button"
                  onClick={(e) => handleCopy(inv._id, e)}
                  className="text-slate-500 hover:text-slate-300 p-0.5"
                  title="Copy ID"
                >
                  {isCopied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              <Link
                to={`/investments/${inv._id}`}
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 rounded bg-emerald-950/30 hover:bg-emerald-950/50 transition-colors"
              >
                <span>View Details</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InvestmentsCardList;

