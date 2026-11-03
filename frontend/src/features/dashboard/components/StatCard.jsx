import React from 'react';
import { formatPaiseToINR } from '../../../utils/formatters';

/**
 * StatCard Component
 * Displays a high-contrast fintech financial KPI metric card with iconography,
 * secondary badges/trend indicators, and dual-column bottom metadata.
 */
export const StatCard = ({
  title,
  amountPaise,
  icon: Icon,
  variant = 'default',
  trendText,
  subBadges = [],
  footerLeft,
  footerRight,
  // Backward compatibility props
  count,
  countLabel = 'packages',
  subtitle,
  badgeText = null
}) => {
  const isEmerald = variant === 'emerald';
  const isCyan = variant === 'cyan';
  const isPurple = variant === 'purple';

  return (
    <div className="bg-[#0b101b] border border-slate-800/90 rounded-2xl p-5 hover:border-slate-700 transition-all duration-200 flex flex-col justify-between shadow-sm relative overflow-hidden group">
      <div>
        {/* Top Header: Title & Icon */}
        <div className="flex items-center justify-between text-slate-400 mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
              isEmerald
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                : isCyan
                ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/50'
                : isPurple
                ? 'bg-purple-950/80 text-purple-400 border border-purple-800/50'
                : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
            }`}
          >
            {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
          </div>
        </div>

        {/* Big Amount */}
        <div
          className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            isEmerald
              ? 'text-emerald-400'
              : isCyan
              ? 'text-cyan-300'
              : 'text-white'
          }`}
        >
          {formatPaiseToINR(amountPaise)}
        </div>

        {/* Subtitle / Badges / Trend Row */}
        <div className="mt-2 min-h-[20px] flex flex-wrap items-center gap-1.5 text-xs">
          {trendText && (
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              {trendText}
            </span>
          )}

          {subBadges && subBadges.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {subBadges.map((badge, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                    badge.variant === 'emerald'
                      ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-800/60'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {badge.text}
                </span>
              ))}
            </div>
          )}

          {subtitle && !trendText && (!subBadges || subBadges.length === 0) && (
            <span className="text-[11px] text-slate-400 font-medium">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Card Footer: Metadata Split */}
      <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400">
        <div>
          {footerLeft ? (
            <span className="text-slate-400 text-[11px]">{footerLeft}</span>
          ) : count !== undefined && count !== null ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="font-semibold text-slate-200">{count}</span>
              <span>{countLabel}</span>
            </span>
          ) : (
            <span className="text-slate-500 text-[11px]">—</span>
          )}
        </div>

        <div>
          {footerRight ? (
            <span className="font-semibold text-slate-200 text-[11px]">{footerRight}</span>
          ) : badgeText ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
              {badgeText}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
