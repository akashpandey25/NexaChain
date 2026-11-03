import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Copy,
  Check,
  Calendar,
  Percent,
  Clock,
  ShieldCheck
} from 'lucide-react';
import {
  formatPaiseToINR,
  formatBusinessDate,
  getStatusStyle
} from '../../../utils/formatters';

/**
 * Desktop Investment Listing Table Component
 * 
 * @param {object} props
 * @param {Array} props.investments List of investment objects
 */
export const InvestmentsTable = ({ investments = [] }) => {
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
                Reference ID
              </th>
              <th scope="col" className="px-5 py-3.5">
                Plan
              </th>
              <th scope="col" className="px-5 py-3.5">
                Principal Amount
              </th>
              <th scope="col" className="px-5 py-3.5">
                ROI Yield
              </th>
              <th scope="col" className="px-5 py-3.5">
                Start Date
              </th>
              <th scope="col" className="px-5 py-3.5">
                End Date
              </th>
              <th scope="col" className="px-5 py-3.5">
                Status
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {investments.map((inv) => {
              const statusStyle = getStatusStyle(inv.status);
              const shortId = inv._id ? `${inv._id.slice(0, 6)}...${inv._id.slice(-4)}` : '—';
              const isCopied = copiedId === inv._id;

              return (
                <tr
                  key={inv._id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Reference ID */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-slate-300 font-medium tracking-tight"
                        title={inv._id}
                      >
                        {shortId}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(inv._id, e)}
                        className="text-slate-500 hover:text-slate-300 p-1 rounded transition-colors"
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

                  {/* Plan Name */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/50">
                      {inv.planName || 'STANDARD'}
                    </span>
                  </td>

                  {/* Principal Amount */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-semibold text-white">
                      {formatPaiseToINR(inv.principalAmountPaise)}
                    </div>
                    {typeof inv.totalRoiEarnedPaise === 'number' && inv.totalRoiEarnedPaise > 0 && (
                      <div className="text-[10px] text-emerald-400/90 mt-0.5">
                        +{formatPaiseToINR(inv.totalRoiEarnedPaise)} earned
                      </div>
                    )}
                  </td>

                  {/* ROI Percentage */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                      <Percent className="w-3 h-3" />
                      {Number(inv.roiPercentage).toFixed(2)}% Daily
                    </span>
                  </td>

                  {/* Start Date */}
                  <td className="px-5 py-4 whitespace-nowrap text-slate-300">
                    {formatBusinessDate(inv.startDate || inv.createdAt)}
                  </td>

                  {/* End Date */}
                  <td className="px-5 py-4 whitespace-nowrap text-slate-400">
                    {inv.endDate ? (
                      formatBusinessDate(inv.endDate)
                    ) : (
                      <span className="text-slate-500 italic">Indefinite</span>
                    )}
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

                  {/* Action */}
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <Link
                      to={`/investments/${inv._id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:text-white bg-emerald-950/40 hover:bg-emerald-600 border border-emerald-800/50 hover:border-emerald-600 transition-all shadow-sm"
                    >
                      <span>Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
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

export default InvestmentsTable;

