import React from 'react';

/**
 * DashboardSkeleton Component
 * Animated placeholder skeleton rendered while dashboard metrics are being fetched.
 */
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading dashboard data">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-surface-elevated rounded-button" />
          <div className="h-4 w-72 bg-surface-elevated/60 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-surface-elevated rounded-button" />
          <div className="h-9 w-32 bg-surface-elevated rounded-button" />
        </div>
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface-card border border-border-subtle rounded-card p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-24 bg-surface-elevated rounded" />
              <div className="w-8 h-8 bg-surface-elevated rounded-lg" />
            </div>
            <div className="h-7 w-36 bg-surface-elevated rounded" />
            <div className="h-3.5 w-28 bg-surface-elevated/60 rounded" />
          </div>
        ))}
      </div>

      {/* Referral Banner Skeleton */}
      <div className="bg-surface-card border border-border-subtle rounded-card p-5 space-y-4">
        <div className="h-4 w-48 bg-surface-elevated rounded" />
        <div className="h-8 w-full bg-surface-elevated/40 rounded-button" />
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-card border border-border-subtle rounded-card p-6 h-80 space-y-4">
          <div className="h-4 w-40 bg-surface-elevated rounded" />
          <div className="h-56 bg-surface-elevated/30 rounded-card" />
        </div>
        <div className="bg-surface-card border border-border-subtle rounded-card p-6 h-80 space-y-4">
          <div className="h-4 w-40 bg-surface-elevated rounded" />
          <div className="h-56 bg-surface-elevated/30 rounded-card" />
        </div>
      </div>

      {/* Activity Skeleton */}
      <div className="bg-surface-card border border-border-subtle rounded-card p-6 h-60 space-y-4">
        <div className="h-4 w-32 bg-surface-elevated rounded" />
        <div className="space-y-3">
          <div className="h-12 bg-surface-elevated/40 rounded-card" />
          <div className="h-12 bg-surface-elevated/40 rounded-card" />
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;

