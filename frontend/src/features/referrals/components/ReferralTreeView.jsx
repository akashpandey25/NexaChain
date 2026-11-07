import React, { useState } from 'react';
import {
  GitFork,
  ChevronRight,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { useGetReferralTreeQuery } from '../referralApi';
import { formatBusinessDate, formatIndianNumber } from '../../../utils/formatters';
import { ErrorMessage } from '../../../components/feedback/ErrorMessage';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { StatusBadge } from '../../../components/common/StatusBadge';

const LEVEL_COLORS = {
  0: { badge: 'bg-brand-primary/10 text-brand-primary border-brand-primary/30', dot: 'bg-brand-primary', label: 'Root (You)' },
  1: { badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', dot: 'bg-indigo-400', label: 'Level 1' },
  2: { badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30', dot: 'bg-purple-400', label: 'Level 2' },
  3: { badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', dot: 'bg-cyan-400', label: 'Level 3' },
  default: { badge: 'bg-surface-elevated text-text-secondary border-border-subtle', dot: 'bg-text-secondary', label: 'Downline' }
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
    <div className={`relative ${isRoot ? '' : 'ml-3 sm:ml-7 mt-2.5'}`}>
      {/* Visual connector line for nested nodes */}
      {!isRoot && (
        <div
          className="absolute -left-3 sm:-left-5 top-5 w-3 sm:w-5 h-px bg-border-strong"
          aria-hidden="true"
        />
      )}

      {/* Node Box */}
      <div
        className={`rounded-card border transition-all p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm min-w-[280px] ${
          isRoot
            ? 'bg-surface-card border-brand-primary/40 ring-1 ring-brand-primary/20'
            : 'bg-surface-card border-border-subtle hover:border-border-strong'
        }`}
      >
        {/* Left: User & Level Identification */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded bg-surface-elevated hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors shrink-0"
              title={isExpanded ? 'Collapse branch' : 'Expand branch'}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-brand-primary" />
              ) : (
                <ChevronRight className="w-4 h-4 text-text-muted" />
              )}
            </button>
          ) : (
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-border-strong" />
            </div>
          )}

          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center font-bold text-xs text-brand-primary shrink-0">
            {node.name ? node.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-text-primary text-sm truncate">{node.name || 'Member'}</span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${levelMeta.badge} shrink-0`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${levelMeta.dot}`} />
                {levelMeta.label}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5 font-mono">
              <span>Code: {node.referralCode || '—'}</span>
              {node.createdAt && (
                <>
                  <span className="text-border-strong">·</span>
                  <span className="font-sans text-[11px] text-text-muted">
                    Joined {formatBusinessDate(node.createdAt)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Branch Info & Status */}
        <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto text-xs shrink-0 pl-8 sm:pl-0">
          {hasChildren && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-surface-canvas border border-border-subtle text-text-secondary">
              <GitFork className="w-3 h-3 text-indigo-400" />
              {children.length} direct {children.length === 1 ? 'branch' : 'branches'}
            </span>
          )}

          <StatusBadge
            status={node.isActive ? 'active' : 'completed'}
            label={node.isActive ? 'ACTIVE' : 'INACTIVE'}
            size="sm"
          />
        </div>
      </div>

      {/* Children Sub-tree (Recursive) */}
      {hasChildren && isExpanded && (
        <div className="relative pl-2 sm:pl-3 border-l border-border-strong ml-2.5 sm:ml-4 mt-1 space-y-2">
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
        <div className="h-12 bg-surface-card border border-border-subtle rounded-card" />
        <div className="h-40 bg-surface-card border border-border-subtle rounded-card" />
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
      <div className="bg-surface-card border border-border-subtle rounded-card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        {/* Left: Summary Metrics */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <span className="text-text-muted block text-[10px] uppercase font-semibold">Network Size</span>
            <span className="text-sm font-semibold text-text-primary font-tabular tabular-nums">
              {formatIndianNumber(totalMembers)} {totalMembers === 1 ? 'member' : 'members'}
            </span>
          </div>
          <div className="h-7 w-px bg-border-subtle hidden sm:block" />
          <div>
            <span className="text-text-muted block text-[10px] uppercase font-semibold">Traversed Depth</span>
            <span className="text-sm font-semibold text-brand-primary font-tabular tabular-nums">
              {metadata?.traversalDepth ?? 0} / {metadata?.maxTraversalDepth ?? maxDepth} Levels
            </span>
          </div>
          <div className="h-7 w-px bg-border-subtle hidden sm:block" />
          <div>
            <span className="text-text-muted block text-[10px] uppercase font-semibold">Direct Branches</span>
            <span className="text-sm font-semibold text-indigo-400 font-tabular tabular-nums">
              {directCount} Level 1
            </span>
          </div>
        </div>

        {/* Right: Depth Selection */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>Traversal Depth:</span>
            <select
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              aria-label="Traversal Depth"
              className="px-2.5 py-1 bg-surface-canvas border border-border-subtle rounded-button text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary cursor-pointer transition-colors"
            >
              {[3, 5, 8, 10].map((depth) => (
                <option key={depth} value={depth}>
                  {depth} Levels
                </option>
              ))}
            </select>
          </div>

          {isFetching && (
            <span className="text-[11px] text-brand-primary animate-pulse font-mono">
              Traversing...
            </span>
          )}
        </div>
      </div>

      {/* Partial Tree / More Levels Notice */}
      {metadata?.hasMoreLevels && (
        <div className="bg-pending/10 border border-pending/30 rounded-card p-4 flex items-start gap-3 text-xs text-pending">
          <AlertTriangle className="w-4 h-4 text-pending shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold block text-amber-300">Deeper Downline Levels Detected</span>
            <p className="text-amber-200/90 leading-relaxed">
              Your network extends deeper than the current safety limit ({metadata.maxTraversalDepth} levels). You can increase the traversal depth up to 10 levels to inspect deeper generation branches.
            </p>
          </div>
        </div>
      )}

      {/* Tree Render or Empty State */}
      {!treeRoot || (!directCount && totalMembers === 0) ? (
        <div className="bg-surface-card border border-border-subtle rounded-card p-8">
          <EmptyState
            icon={GitFork}
            title="No Network Branches Found"
            description="You do not have any registered downline members in your referral tree yet. Share your referral code to invite partners and build your multi-level affiliate network."
          />
        </div>
      ) : (
        <div className="bg-surface-card border border-border-subtle rounded-card p-4 sm:p-6 overflow-x-auto shadow-sm">
          <TreeNode node={treeRoot} isRoot defaultExpanded />
        </div>
      )}
    </div>
  );
};

export default ReferralTreeView;
