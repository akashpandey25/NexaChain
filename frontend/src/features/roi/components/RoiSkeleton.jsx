import React from 'react';

/**
 * Loading skeleton for ROI History & Analytics page.
 */
export const RoiSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Overview Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 bg-slate-900/60 border border-slate-800 rounded-xl p-5"
          />
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 h-72">
        <div className="w-48 h-5 bg-slate-800 rounded mb-6" />
        <div className="w-full h-44 bg-slate-800/40 rounded-lg" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="h-12 bg-slate-950/50 border-b border-slate-800" />
        <div className="divide-y divide-slate-800/60">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-5 py-4 flex items-center justify-between">
              <div className="w-24 h-4 bg-slate-800 rounded" />
              <div className="w-20 h-4 bg-slate-800 rounded" />
              <div className="w-24 h-4 bg-slate-800 rounded" />
              <div className="w-16 h-4 bg-slate-800 rounded" />
              <div className="w-20 h-6 bg-slate-800 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoiSkeleton;

