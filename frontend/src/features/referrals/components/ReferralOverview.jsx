import React from 'react';
import { Users, UserCheck, Wallet, GitFork } from 'lucide-react';
import { formatPaiseToINR, formatIndianNumber } from '../../../utils/formatters';
import { StatCard } from '../../../components/common/StatCard';

/**
 * Referral Overview Cards Component
 * Standardized KPI metrics rendered via the canonical StatCard component.
 * 
 * @param {object} props
 * @param {object} props.referralsMeta Referral statistics from dashboard API
 * @param {object} props.incomeSummary Income summary from referral income API
 * @param {number} [props.networkSize] Total members in referral tree
 * @param {boolean} [props.isLoading] Loading state
 */
export const ReferralOverview = ({
  referralsMeta = {},
  incomeSummary = {},
  networkSize = 0,
  isLoading = false
}) => {
  const totalDirect = referralsMeta?.totalDirectReferrals ?? 0;
  const activeDirect = referralsMeta?.activeDirectReferrals ?? 0;
  const processedIncomePaise =
    referralsMeta?.processedReferralIncomePaise ??
    incomeSummary?.processedIncomePaise ??
    0;
  const pendingIncomePaise = incomeSummary?.pendingIncomePaise ?? 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 bg-surface-card border border-border-subtle rounded-card p-5"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Direct Referrals */}
      <StatCard
        title="DIRECT REFERRALS"
        value={formatIndianNumber(totalDirect)}
        icon={Users}
        subtitle="Level 1 registered downlines"
        variant="default"
        footerLeft="Level 1 sponsor"
        footerRight={`${totalDirect} registered`}
      />

      {/* Card 2: Active Direct Referrals */}
      <StatCard
        title="ACTIVE PARTICIPANTS"
        value={formatIndianNumber(activeDirect)}
        icon={UserCheck}
        subtitle="Active contract participants"
        variant={activeDirect > 0 ? 'emerald' : 'default'}
        footerLeft="Active accounts"
        footerRight={`${activeDirect} active`}
      />

      {/* Card 3: Processed Referral Income */}
      <StatCard
        title="REFERRAL INCOME"
        amountPaise={processedIncomePaise}
        icon={Wallet}
        subtitle={
          pendingIncomePaise > 0
            ? `+${formatPaiseToINR(pendingIncomePaise)} pending`
            : 'Credited directly to wallet'
        }
        variant={processedIncomePaise > 0 ? 'emerald' : 'default'}
        footerLeft="Commission ledger"
        footerRight={processedIncomePaise > 0 ? 'Credited' : 'Inactive policy'}
      />

      {/* Card 4: Total Downline Network Size */}
      <StatCard
        title="DOWNLINE NETWORK"
        value={formatIndianNumber(networkSize > 0 ? networkSize : totalDirect)}
        icon={GitFork}
        subtitle="Multi-level tree members"
        variant="default"
        footerLeft="Total network"
        footerRight={`${networkSize > 0 ? networkSize : totalDirect} members`}
      />
    </div>
  );
};

export default ReferralOverview;
