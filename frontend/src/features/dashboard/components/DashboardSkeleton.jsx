import React from 'react';

/**
 * DashboardSkeleton Component
 * Animated placeholder skeleton rendered while dashboard metrics are being fetched.
 */
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-800 rounded-lg" />
          <div className="h-4 w-72 bg-slate-800/60 rounded-md" />
        </div>
        <div className="h-10 w-36 bg-slate-800 rounded-xl" />
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-slate-800 rounded" />
              <div className="w-8 h-8 bg-slate-800 rounded-xl" />
            </div>
            <div className="h-8 w-36 bg-slate-800 rounded-lg" />
            <div className="h-4 w-28 bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-80 space-y-4">
          <div className="h-5 w-40 bg-slate-800 rounded" />
          <div className="h-60 bg-slate-950/60 rounded-xl" />
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-80 space-y-4">
          <div className="h-5 w-40 bg-slate-800 rounded" />
          <div className="h-60 bg-slate-950/60 rounded-xl" />
        </div>
      </div>

      {/* Activity Skeleton */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-60 space-y-4">
        <div className="h-5 w-32 bg-slate-800 rounded" />
        <div className="space-y-3">
          <div className="h-12 bg-slate-950 rounded-xl" />
          <div className="h-12 bg-slate-950 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
