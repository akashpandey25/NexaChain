import React from 'react';

/**
 * Loading skeleton for investments list (table and mobile cards).
 */
export const InvestmentsSkeleton = () => {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Table Skeleton (Desktop) */}
      <div className="hidden md:block bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="h-12 bg-slate-800/50 border-b border-slate-800" />
        <div className="divide-y divide-slate-800/60">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="w-24 h-4 bg-slate-800 rounded" />
              <div className="w-20 h-5 bg-slate-800 rounded-full" />
              <div className="w-24 h-4 bg-slate-800 rounded" />
              <div className="w-16 h-4 bg-slate-800 rounded" />
              <div className="w-20 h-4 bg-slate-800 rounded" />
              <div className="w-20 h-4 bg-slate-800 rounded" />
              <div className="w-20 h-6 bg-slate-800 rounded-full" />
              <div className="w-20 h-8 bg-slate-800 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Cards Skeleton (Mobile) */}
      <div className="md:hidden space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="w-24 h-5 bg-slate-800 rounded-full" />
              <div className="w-20 h-6 bg-slate-800 rounded-full" />
            </div>
            <div className="w-32 h-6 bg-slate-800 rounded" />
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
              <div className="w-24 h-4 bg-slate-800 rounded" />
              <div className="w-24 h-4 bg-slate-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvestmentsSkeleton;

