import React from 'react';
import { formatPaiseToINR } from '../../../utils/formatters';

/**
 * StatCard Component
 * Displays a single financial KPI metric card with clean fintech typography,
 * Lucide icon, and optional badge or auxiliary subtitle.
 */
export const StatCard = ({
  title,
  amountPaise,
  count,
  countLabel = 'packages',
  icon: Icon,
  subtitle,
  variant = 'default',
  badgeText = null
}) => {
  const isEmerald = variant === 'emerald';
  const isCyan = variant === 'cyan';
  const isPurple = variant === 'purple';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all duration-200 flex flex-col justify-between shadow-sm">
      <div>
        <div className="flex items-center justify-between text-slate-400 mb-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isEmerald
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                : isCyan
                ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/40'
                : isPurple
                ? 'bg-purple-950/80 text-purple-400 border border-purple-800/40'
                : 'bg-slate-800 text-slate-300 border border-slate-700/60'
            }`}
          >
            {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
          </div>
        </div>

        <div
          className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            isEmerald ? 'text-emerald-400' : 'text-white'
          }`}
        >
          {formatPaiseToINR(amountPaise)}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div>
          {count !== undefined && count !== null ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="font-semibold text-slate-200">{count}</span>
              <span>{countLabel}</span>
            </span>
          ) : (
            <span>{subtitle || '—'}</span>
          )}
        </div>

        {badgeText && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;

