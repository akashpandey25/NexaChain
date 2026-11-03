import React from 'react';

/**
 * Loading skeleton for the Investment Detail view (/investments/:id)
 */
export const InvestmentDetailSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back button skeleton */}
      <div className="w-32 h-5 bg-slate-800 rounded" />

      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-2">
          <div className="w-64 h-8 bg-slate-800 rounded" />
          <div className="w-48 h-4 bg-slate-800/60 rounded" />
        </div>
        <div className="w-24 h-7 bg-slate-800 rounded-full" />
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="w-24 h-3 bg-slate-800 rounded" />
              <div className="w-4 h-4 bg-slate-800 rounded" />
            </div>
            <div className="w-36 h-7 bg-slate-800 rounded" />
            <div className="w-40 h-3 bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Information Table Skeleton */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="h-12 bg-slate-950/50 border-b border-slate-800 px-6 py-4">
          <div className="w-40 h-4 bg-slate-800 rounded" />
        </div>
        <div className="divide-y divide-slate-800/60 p-6 space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex justify-between items-center pt-2">
              <div className="w-32 h-4 bg-slate-800/60 rounded" />
              <div className="w-48 h-4 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InvestmentDetailSkeleton;

