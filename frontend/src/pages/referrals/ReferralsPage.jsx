import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { useAppSelector } from '../../app/store';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useGetDashboardDataQuery } from '../../features/dashboard/dashboardApi';
import { useGetReferralTreeQuery, useGetReferralIncomeQuery } from '../../features/referrals/referralApi';
import { ReferralOverview } from '../../features/referrals/components/ReferralOverview';
import { ReferralCodeShareCard } from '../../features/referrals/components/ReferralCodeShareCard';
import { DirectReferralsList } from '../../features/referrals/components/DirectReferralsList';
import { ReferralTreeView } from '../../features/referrals/components/ReferralTreeView';
import { ReferralIncomeHistory } from '../../features/referrals/components/ReferralIncomeHistory';
import { Users, GitFork, Wallet, RefreshCw, ShieldCheck } from 'lucide-react';

const TABS = [
  { id: 'direct', label: 'Direct Referrals', icon: Users, description: 'Level 1 directly sponsored affiliates' },
  { id: 'tree', label: 'Referral Tree', icon: GitFork, description: 'Multi-level downline hierarchical network' },
  { id: 'income', label: 'Commission Income', icon: Wallet, description: 'Audited commission disbursement records' }
];

/**
 * Referral Management Page
 * Orchestrates referral overview metrics, code sharing, direct downlines,
 * multi-tier tree visualization, and commission payout histories.
 */
export const ReferralsPage = () => {
  const user = useAppSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState('direct');

  // Authoritative overview metrics
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    refetch: refetchDashboard
  } = useGetDashboardDataQuery();

  const {
    data: treeData,
    refetch: refetchTree
  } = useGetReferralTreeQuery({ maxDepth: 5 });

  const {
    data: incomeData,
    refetch: refetchIncome
  } = useGetReferralIncomeQuery({ page: 1, limit: 1 });

  const handleRefresh = () => {
    refetchDashboard();
    refetchTree();
    refetchIncome();
  };

  const networkSize = treeData?.metadata?.totalMembers ?? 0;

  return (
    <div className="space-y-6 min-w-0">
      {/* Header */}
      <PageHeader
        title="Referral Management"
        subtitle="Grow your multi-level affiliate network, inspect downline trees, and track commission earnings"
        actions={
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium bg-surface-card border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors shadow-sm"
            title="Refresh referral metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        }
      />

      {/* KPI Overview Cards */}
      <ReferralOverview
        referralsMeta={dashboardData?.referrals}
        incomeSummary={incomeData?.summary}
        networkSize={networkSize}
        isLoading={isDashboardLoading && !dashboardData}
      />

      {/* Referral Code & Share Link Banner */}
      <ReferralCodeShareCard referralCode={user?.referralCode} />

      {/* Navigation Tabs */}
      <div className="border-b border-border-subtle">
        <div className="flex flex-wrap gap-2 sm:gap-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3.5 pt-1 inline-flex items-center gap-2 border-b-2 text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'border-brand-primary text-brand-primary font-semibold'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-primary' : 'text-text-muted'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'direct' && <DirectReferralsList />}
        {activeTab === 'tree' && <ReferralTreeView />}
        {activeTab === 'income' && <ReferralIncomeHistory />}
      </div>

      {/* Governance & Compliance Footer Note */}
      <div className="bg-surface-card border border-border-subtle rounded-card p-4.5 flex items-start gap-3 text-xs text-text-secondary shadow-sm">
        <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-text-primary">Affiliate Governance Notice:</strong> Referral commissions are triggered and calculated strictly by server batch jobs upon validated downline investment activations or daily ROI payouts. Commission percentages and eligible depths follow the system's approved financial rules.
        </p>
      </div>
    </div>
  );
};

export default ReferralsPage;
