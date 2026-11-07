import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, ArrowUpRight, Percent } from 'lucide-react';
import {
  formatPaiseToINR,
  formatBusinessDate,
  formatDateTime
} from '../../../utils/formatters';
import { StatusBadge } from '../../../components/common/StatusBadge';

/**
 * Desktop ROI Transaction History Table Component
 * Displays verified daily ROI distribution credits with exact integer paise precision.
 * 
 * @param {object} props
 * @param {Array} props.records List of populated ROI history records
 */
export const RoiHistoryTable = ({ records = [] }) => {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-surface-card border border-border-subtle rounded-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-elevated/40 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              <th scope="col" className="px-5 py-3.5">
                Ledger Reference
              </th>
              <th scope="col" className="px-5 py-3.5">
                Business Date
              </th>
              <th scope="col" className="px-5 py-3.5">
                Contract Plan
              </th>
              <th scope="col" className="px-5 py-3.5">
                Contract Principal
              </th>
              <th scope="col" className="px-5 py-3.5">
                Daily Rate
              </th>
              <th scope="col" className="px-5 py-3.5">
                Credited Amount
              </th>
              <th scope="col" className="px-5 py-3.5">
                Status
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                Posted Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle text-xs">
            {records.map((rec) => {
              const shortId = rec._id ? `${rec._id.slice(0, 6)}...${rec._id.slice(-4)}` : '—';
              const isCopied = copiedId === rec._id;
              const investment = rec.investment || {};

              return (
                <tr
                  key={rec._id}
                  className="hover:bg-surface-hover/50 transition-colors group"
                >
                  {/* Ledger Reference ID */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-mono text-text-secondary font-medium">
                      <span title={rec._id}>{shortId}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(rec._id, e)}
                        className="text-text-muted hover:text-text-primary p-1 rounded transition-colors"
                        title={isCopied ? 'Copied ID!' : 'Copy reference ID'}
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3 text-brand-primary" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Business Date */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="font-semibold text-text-primary">
                      {formatBusinessDate(rec.businessDate)}
                    </span>
                  </td>

                  {/* Investment Plan */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    {investment._id ? (
                      <Link
                        to={`/investments/${investment._id}`}
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium group/link"
                        title={`View ${investment.planName || 'Contract'}`}
                      >
                        <span className="px-2 py-0.5 rounded text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover/link:border-indigo-400/40 transition-colors">
                          {investment.planName || 'Contract'}
                        </span>
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      </Link>
                    ) : (
                      <span className="text-text-muted italic">Historical Contract</span>
                    )}
                  </td>

                  {/* Contract Principal */}
                  <td className="px-5 py-4 whitespace-nowrap text-text-primary font-medium font-tabular tabular-nums">
                    {typeof investment.principalAmountPaise === 'number'
                      ? formatPaiseToINR(investment.principalAmountPaise)
                      : '—'}
                  </td>

                  {/* Applied Daily Rate */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 font-mono text-text-secondary tabular-nums">
                      <Percent className="w-3 h-3 text-brand-primary" />
                      {Number(rec.roiPercentageApplied).toFixed(2)}%
                    </span>
                  </td>

                  {/* Credited Payout Amount */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="font-bold text-semantic-positive text-sm font-tabular tabular-nums">
                      +{formatPaiseToINR(rec.amountPaise)}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <StatusBadge status={rec.status} />
                  </td>

                  {/* Posted Timestamp */}
                  <td className="px-5 py-4 whitespace-nowrap text-right text-text-secondary">
                    {formatDateTime(rec.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoiHistoryTable;
