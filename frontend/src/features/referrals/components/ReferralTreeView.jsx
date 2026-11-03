import React, { useState } from 'react';
import {
  GitFork,
  ChevronRight,
  ChevronDown,
  User,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Layers,
  ChevronUp
} from 'lucide-react';
import { useGetReferralTreeQuery } from '../referralApi';
import { formatBusinessDate, formatIndianNumber } from '../../../utils/formatters';
import { ErrorMessage } from '../../../components/feedback/ErrorMessage';
import { EmptyState } from '../../../components/feedback/EmptyState';

const LEVEL_COLORS = {
  0: { badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60', dot: 'bg-emerald-400', label: 'Root (You)' },
  1: { badge: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60', dot: 'bg-indigo-400', label: 'Level 1' },
  2: { badge: 'bg-purple-950/80 text-purple-300 border-purple-800/60', dot: 'bg-purple-400', label: 'Level 2' },
  3: { badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60', dot: 'bg-cyan-400', label: 'Level 3' },
  default: { badge: 'bg-slate-800 text-slate-300 border-slate-700', dot: 'bg-slate-400', label: 'Downline' }
};

const getLevelMeta = (level) => LEVEL_COLORS[level] || { ...LEVEL_COLORS.default, label: `Level ${level}` };

/**
 * Individual Referral Tree Node Component
 * Supports recursive rendering, expand/collapse toggling, and cycle-safe depth bounding.
 */
const TreeNode = ({ node, isRoot = false, defaultExpanded = true }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!node) return null;

  const children = Array.isArray(node.children) ? node.children : [];
  const hasChildren = children.length > 0;
  const levelMeta = getLevelMeta(node.level);

  return (
    <div className={`relative ${isRoot ? '' : 'ml-4 sm:ml-8 mt-2.5'}`}>
      {/* Visual connector line for nested nodes */}
      {!isRoot && (
        <div
          className="absolute -left-4 sm:-left-6 top-5 w-4 sm:w-6 h-px bg-slate-700/60"
          aria-hidden="true"
        />
      )}

      {/* Node Box */}
      <div
        className={`rounded-xl border transition-all p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md ${
          isRoot
            ? 'bg-slate-900 border-emerald-800/50 hover:border-emerald-700 ring-1 ring-emerald-500/20'
            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
        }`}
      >
        {/* Left: User & Level Identification */}
        <div className="flex items-center gap-3">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title={isExpanded ? 'Collapse branch' : 'Expand branch'}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-emerald-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
          ) : (
            <div className="w-6 h-6 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            </div>
          )}

          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
            {node.name ? node.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">{node.name || 'Member'}</span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${levelMeta.badge}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${levelMeta.dot}`} />
                {levelMeta.label}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
              <span>Code: {node.referralCode || '—'}</span>
              {node.createdAt && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="font-sans text-[11px] text-slate-400">
                    Joined {formatBusinessDate(node.createdAt)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Branch Info & Status */}
        <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto text-xs shrink-0 pl-11 sm:pl-0">
          {hasChildren && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-950 border border-slate-800 text-slate-300">
              <GitFork className="w-3 h-3 text-indigo-400" />
              {children.length} direct {children.length === 1 ? 'branch' : 'branches'}
            </span>
          )}

          {node.isActive ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/60">
              ACTIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
              INACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Children Sub-tree (Recursive) */}
      {hasChildren && isExpanded && (
        <div className="relative pl-2 sm:pl-4 border-l border-slate-800/80 ml-3 sm:ml-5 mt-1 space-y-2">
          {children.map((child) => (
            <TreeNode key={child.userId || child.referralCode} node={child} isRoot={false} />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Referral Tree Visualization View
 */
export const ReferralTreeView = () => {
  const [maxDepth, setMaxDepth] = useState(5);

  const { data, isLoading, isFetching, error, refetch } = useGetReferralTreeQuery({
    maxDepth
  });

  const treeRoot = data?.tree || null;
  const metadata = data?.metadata || {};

  if (isLoading && !data) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-slate-800/60 rounded-xl" />
        <div className="h-40 bg-slate-900/60 border border-slate-800 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title="Could Not Load Referral Tree"
        message={error?.data?.message || error?.message || 'Failed to construct downline tree network.'}
        errors={error?.data?.errors}
        onRetry={refetch}
      />
    );
  }

  const directCount = treeRoot?.children?.length ?? 0;
  const totalMembers = metadata?.totalMembers ?? directCount;

  return (
    <div className="space-y-5">
      {/* Tree Controls & Metadata Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Summary Metrics */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Network Size</span>
            <span className="text-sm font-bold text-white font-mono">
              {formatIndianNumber(totalMembers)} {totalMembers === 1 ? 'member' : 'members'}
            </span>
          </div>
          <div className="h-7 w-px bg-slate-800 hidden sm:block" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Traversed Depth</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {metadata?.traversalDepth ?? 0} / {metadata?.maxTraversalDepth ?? maxDepth} Levels
            </span>
          </div>
          <div className="h-7 w-px bg-slate-800 hidden sm:block" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Direct Branches</span>
            <span className="text-sm font-bold text-indigo-300 font-mono">
              {directCount} Level 1
            </span>
          </div>
        </div>

        {/* Right: Depth Selection */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Traversal Depth:</span>
            <select
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              aria-label="Traversal Depth"
              className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {[3, 5, 8, 10].map((depth) => (
                <option key={depth} value={depth}>
                  {depth} Levels
                </option>
              ))}
            </select>
          </div>

          {isFetching && (
            <span className="text-[11px] text-emerald-400 animate-pulse font-mono">
              Traversing...
            </span>
          )}
        </div>
      </div>

      {/* Partial Tree / More Levels Notice */}
      {metadata?.hasMoreLevels && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold block">Deeper Downline Levels Detected</span>
            <p className="text-amber-300/80">
              Your network extends deeper than the current safety limit ({metadata.maxTraversalDepth} levels). You can increase the traversal depth up to 10 levels to inspect deeper generation branches.
            </p>
          </div>
        </div>
      )}

      {/* Tree Render or Empty State */}
      {!treeRoot || (!directCount && totalMembers === 0) ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8">
          <EmptyState
            icon={GitFork}
            title="No Network Branches Found"
            description="You do not have any registered downline members in your referral tree yet. Share your referral code to invite partners and build your multi-level affiliate network."
          />
        </div>
      ) : (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 sm:p-6 overflow-x-auto shadow-inner">
          <TreeNode node={treeRoot} isRoot defaultExpanded />
        </div>
      )}
    </div>
  );
};

export default ReferralTreeView;

