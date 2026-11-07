import React from 'react';

/**
 * Loading skeleton for the Investment Detail view (/investments/:id)
 */
export const InvestmentDetailSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back button skeleton */}
      <div className="w-32 h-5 bg-surface-elevated rounded" />

      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-2">
          <div className="w-64 h-8 bg-surface-elevated rounded" />
          <div className="w-48 h-4 bg-surface-elevated/60 rounded" />
        </div>
        <div className="w-24 h-7 bg-surface-elevated rounded-full" />
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface-card border border-border-subtle rounded-card p-5 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="w-24 h-3 bg-surface-elevated rounded" />
              <div className="w-4 h-4 bg-surface-elevated rounded" />
            </div>
            <div className="w-36 h-7 bg-surface-elevated rounded" />
            <div className="w-40 h-3 bg-surface-elevated/60 rounded" />
          </div>
        ))}
      </div>

      {/* Information Table Skeleton */}
      <div className="bg-surface-card border border-border-subtle rounded-card overflow-hidden">
        <div className="h-12 bg-surface-elevated/50 border-b border-border-subtle px-6 py-4">
          <div className="w-40 h-4 bg-surface-elevated rounded" />
        </div>
        <div className="divide-y divide-border-subtle p-6 space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex justify-between items-center pt-2">
              <div className="w-32 h-4 bg-surface-elevated/60 rounded" />
              <div className="w-48 h-4 bg-surface-elevated rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InvestmentDetailSkeleton;
