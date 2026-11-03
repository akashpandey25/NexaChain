import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, ArrowUpRight, Percent, Calendar } from 'lucide-react';
import {
  formatPaiseToINR,
  formatBusinessDate,
  formatDateTime,
  getStatusStyle
} from '../../../utils/formatters';

/**
 * Desktop ROI Transaction History Table Component
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
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th scope="col" className="px-5 py-3.5">
                Transaction ID
              </th>
              <th scope="col" className="px-5 py-3.5">
                Business Date
              </th>
              <th scope="col" className="px-5 py-3.5">
                Investment Plan
              </th>
              <th scope="col" className="px-5 py-3.5">
                Principal
              </th>
              <th scope="col" className="px-5 py-3.5">
                Applied Rate
              </th>
              <th scope="col" className="px-5 py-3.5">
                ROI Yield
              </th>
              <th scope="col" className="px-5 py-3.5">
                Status
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                Processed Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {records.map((rec) => {
              const statusStyle = getStatusStyle(rec.status);
              const shortId = rec._id ? `${rec._id.slice(0, 6)}...${rec._id.slice(-4)}` : '—';
              const isCopied = copiedId === rec._id;
              const investment = rec.investment || {};

              return (
                <tr
                  key={rec._id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Reference ID */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-mono text-slate-300 font-medium">
                      <span title={rec._id}>{shortId}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(rec._id, e)}
                        className="text-slate-500 hover:text-slate-300 p-1"
                        title={isCopied ? 'Copied ID!' : 'Copy full ID'}
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Business Date */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="font-semibold text-white">
                      {formatBusinessDate(rec.businessDate)}
                    </span>
                  </td>

                  {/* Investment Plan */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    {investment._id ? (
                      <Link
                        to={`/investments/${investment._id}`}
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                        title={`View ${investment.planName || 'Investment'}`}
                      >
                        <span className="px-2 py-0.5 rounded text-xs bg-indigo-950/60 border border-indigo-800/50">
                          {investment.planName || 'Contract'}
                        </span>
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ) : (
                      <span className="text-slate-500 italic">Historical Plan</span>
                    )}
                  </td>

                  {/* Principal */}
                  <td className="px-5 py-4 whitespace-nowrap text-slate-300 font-medium">
                    {typeof investment.principalAmountPaise === 'number'
                      ? formatPaiseToINR(investment.principalAmountPaise)
                      : '—'}
                  </td>

                  {/* Applied ROI Rate */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 font-mono text-slate-300">
                      <Percent className="w-3 h-3 text-emerald-400" />
                      {Number(rec.roiPercentageApplied).toFixed(2)}%
                    </span>
                  </td>

                  {/* Payout Amount */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="font-bold text-emerald-400 text-sm">
                      +{formatPaiseToINR(rec.amountPaise)}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {statusStyle.label}
                    </span>
                  </td>

                  {/* Processed Timestamp */}
                  <td className="px-5 py-4 whitespace-nowrap text-right text-slate-300">
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
