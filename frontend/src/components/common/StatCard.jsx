import React from 'react';
import { formatPaiseToINR } from '../../utils/formatters';

/**
 * StatCard Component
 * 
 * Canonical institutional fintech metric card for KPIs across Dashboard,
 * Investments, ROI, and Referral overviews.
 * 
 * Visual features:
 * - Surface: `#111726` (surface-card) with subtle border (#1B2438) and 12px radius (rounded-card)
 * - Value: High-contrast `font-mono tabular-nums text-text-primary` (semantic positive/pending color applied ONLY for actual deltas or status)
 * - Zero gradients or glow effects
 * 
 * @param {object} props
 * @param {string} props.title Metric label
 * @param {string|number} [props.value] Pre-formatted metric string or raw count
 * @param {number} [props.amountPaise] Integer paise to format as INR currency
 * @param {React.ComponentType} [props.icon] Lucide icon component
 * @param {'default'|'positive'|'emerald'|'pending'|'danger'|'cyan'|'purple'} [props.variant='default'] Semantic color variant
 * @param {string} [props.subtitle] Contextual description under value
 * @param {string} [props.trendText] Optional positive/negative trend string
 * @param {Array<{text: string, variant?: string}>} [props.subBadges] Optional secondary status pills
 * @param {React.ReactNode} [props.footerLeft] Left-aligned footer metadata
 * @param {React.ReactNode} [props.footerRight] Right-aligned footer metadata
 * @param {number} [props.count] Backward-compatible count prop
 * @param {string} [props.countLabel] Backward-compatible count label
 * @param {string} [props.badgeText] Backward-compatible badge text
 * @param {string} [props.className] Class overrides
 */
export const StatCard = ({
  title,
  value,
  amountPaise,
  icon: Icon,
  variant = 'default',
  subtitle,
  trendText,
  subBadges = [],
  footerLeft,
  footerRight,
  // Backward compatibility props
  count,
  countLabel = 'packages',
  badgeText = null,
  className = ''
}) => {
  // Determine display value: explicit value, formatted paise, or count
  let displayValue = '—';
  if (value !== undefined && value !== null) {
    displayValue = value;
  } else if (amountPaise !== undefined && amountPaise !== null) {
    displayValue = formatPaiseToINR(amountPaise);
  } else if (count !== undefined && count !== null) {
    displayValue = count;
  }

  // Variant color mapping: only semantic deltas/statuses receive color
  const isPositive = variant === 'positive' || variant === 'emerald';
  const isPending = variant === 'pending';
  const isDanger = variant === 'danger' || variant === 'destructive';

  const valueColorClass = isPositive
    ? 'text-semantic-positive'
    : isPending
    ? 'text-semantic-pending'
    : isDanger
    ? 'text-semantic-danger'
    : 'text-text-primary';

  const iconContainerClass = isPositive
    ? 'bg-semantic-positive/10 text-semantic-positive border-semantic-positive/20'
    : isPending
    ? 'bg-semantic-pending/10 text-semantic-pending border-semantic-pending/20'
    : isDanger
    ? 'bg-semantic-danger/10 text-semantic-danger border-semantic-danger/20'
    : 'bg-surface-elevated text-text-secondary border-border-subtle group-hover:text-text-primary';

  const hasFooter = footerLeft || footerRight || count !== undefined || badgeText;

  return (
    <div
      className={`bg-surface-card border border-border-subtle hover:border-border-strong rounded-card p-5 transition-all duration-150 flex flex-col justify-between shadow-sm relative group ${className}`}
    >
      <div>
        {/* Top Header: Title & Icon */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider select-none truncate">
            {title}
          </span>
          {Icon && (
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${iconContainerClass}`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Big Tabular Numeric Amount */}
        <div
          className={`text-2xl sm:text-3xl font-bold tracking-tight font-mono tabular-nums leading-tight ${valueColorClass}`}
        >
          {displayValue}
        </div>

        {/* Subtitle / Trend / SubBadges */}
        {(subtitle || trendText || (subBadges && subBadges.length > 0)) && (
          <div className="mt-2 min-h-[18px] flex flex-wrap items-center gap-2 text-xs">
            {trendText && (
              <span className="text-xs text-semantic-positive font-medium flex items-center gap-1">
                {trendText}
              </span>
            )}

            {subBadges && subBadges.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {subBadges.map((badge, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      badge.variant === 'emerald' || badge.variant === 'positive'
                        ? 'bg-semantic-positive/10 text-semantic-positive border-semantic-positive/30'
                        : badge.variant === 'pending'
                        ? 'bg-semantic-pending/10 text-semantic-pending border-semantic-pending/30'
                        : 'bg-surface-elevated text-text-secondary border-border-subtle'
                    }`}
                  >
                    {badge.text}
                  </span>
                ))}
              </div>
            )}

            {subtitle && (
              <span className="text-xs text-text-muted leading-normal">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Metadata Split */}
      {hasFooter && (
        <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
          <div className="truncate pr-2">
            {footerLeft ? (
              <span className="text-text-muted text-[11px]">{footerLeft}</span>
            ) : count !== undefined && count !== null ? (
              <span className="inline-flex items-center gap-1 text-[11px]">
                <span className="font-semibold text-text-secondary">{count}</span>
                <span>{countLabel}</span>
              </span>
            ) : (
              <span className="text-text-muted text-[11px]">—</span>
            )}
          </div>

          <div className="shrink-0 text-right">
            {footerRight ? (
              <span className="font-medium text-text-secondary text-[11px]">
                {footerRight}
              </span>
            ) : badgeText ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-semantic-positive/10 text-semantic-positive border border-semantic-positive/30">
                {badgeText}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatCard;
