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
    <div className="bg-surface-card border border-border-subtle rounded-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-canvas/50 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
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
          <tbody className="divide-y divide-border-subtle text-xs">
            {investments.map((inv) => {
              const shortId = inv._id ? `${inv._id.slice(0, 6)}...${inv._id.slice(-4)}` : '—';
              const isCopied = copiedId === inv._id;

              return (
                <tr
                  key={inv._id}
                  className="hover:bg-surface-card-hover/40 transition-colors group"
                >
                  {/* Reference ID */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-text-secondary font-medium tracking-tight text-xs"
                        title={inv._id}
                      >
                        {shortId}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(inv._id, e)}
                        className="text-text-muted hover:text-text-primary p-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-semantic-focus"
                        title={isCopied ? 'Copied ID!' : 'Copy full ID'}
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-semantic-positive" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Plan Name */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-surface-elevated text-text-primary border border-border-subtle">
                      {inv.planName || 'STANDARD'}
                    </span>
                  </td>

                  {/* Principal Amount */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-semibold font-sans font-tabular tabular-nums text-text-primary text-sm">
                      {formatPaiseToINR(inv.principalAmountPaise)}
                    </div>
                    {typeof inv.totalRoiEarnedPaise === 'number' && inv.totalRoiEarnedPaise > 0 && (
                      <div className="text-[11px] font-sans font-tabular tabular-nums text-semantic-positive mt-0.5">
                        +{formatPaiseToINR(inv.totalRoiEarnedPaise)} earned
                      </div>
                    )}
                  </td>

                  {/* ROI Percentage */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 font-semibold font-sans font-tabular tabular-nums text-semantic-positive bg-semantic-positive/10 px-2 py-0.5 rounded border border-semantic-positive/30">
                      <Percent className="w-3 h-3" />
                      {Number(inv.roiPercentage).toFixed(2)}% Daily
                    </span>
                  </td>

                  {/* Start Date */}
                  <td className="px-5 py-4 whitespace-nowrap text-text-secondary">
                    {inv.status === 'pending' ? (
                      <span className="text-semantic-pending italic">Pending Activation</span>
                    ) : inv.status === 'cancelled' ? (
                      <span className="text-text-muted italic">Not Activated</span>
                    ) : (
                      formatBusinessDate(inv.startDate || inv.createdAt)
                    )}
                  </td>

                  {/* End Date */}
                  <td className="px-5 py-4 whitespace-nowrap text-text-muted">
                    {inv.status === 'pending' ? (
                      <span className="text-semantic-pending italic">Pending Activation</span>
                    ) : inv.status === 'cancelled' ? (
                      <span className="text-text-muted italic">Not Applicable</span>
                    ) : inv.endDate ? (
                      formatBusinessDate(inv.endDate)
                    ) : (
                      <span className="text-text-muted italic">Ongoing</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <StatusBadge status={inv.status} size="sm" />
                  </td>

                  {/* Action */}
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <Link
                      to={`/investments/${inv._id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-button text-xs font-medium text-text-primary bg-surface-elevated hover:bg-surface-card-hover border border-border-subtle hover:border-border-strong transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-semantic-focus"
                    >
                      <span>Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-text-muted" />
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
