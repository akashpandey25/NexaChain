import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { AppButton } from '../../components/common/AppButton';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';
import { EmptyState } from '../../components/feedback/EmptyState';
import {
  useGetDirectReferralsQuery,
  useGetReferralTreeQuery,
  useGetReferralIncomeQuery
} from '../../features/referrals/referralApi';
import { useAppSelector } from '../../app/store';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { Users, GitFork, DollarSign, Copy, Check, Shield } from 'lucide-react';

const formatPaise = (paise = 0) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(paise / 100);
};

export const ReferralsPage = () => {
  const user = useAppSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState('direct'); // 'direct' | 'tree' | 'income'
  const [copied, setCopied] = useState(false);

  // Queries
  const {
    data: directData,
    isLoading: isDirectLoading,
    error: directError
  } = useGetDirectReferralsQuery(undefined, { skip: activeTab !== 'direct' });

  const {
    data: treeData,
    isLoading: isTreeLoading,
    error: treeError
  } = useGetReferralTreeQuery({ maxDepth: 5 }, { skip: activeTab !== 'tree' });

  const {
    data: incomeData,
    isLoading: isIncomeLoading,
    error: incomeError
  } = useGetReferralIncomeQuery(undefined, { skip: activeTab !== 'income' });

  const handleCopyCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const directList = directData?.data?.referrals || (Array.isArray(directData?.data) ? directData.data : []);
  const treeRoot = treeData?.data || null;
  const incomeList = incomeData?.data?.incomes || (Array.isArray(incomeData?.data) ? incomeData.data : []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referral Program"
        subtitle="Grow your multi-level affiliate network and earn automated commissions"
      />

      {/* Referral Code Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-700/50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-indigo-300">Your Exclusive Referral Code</span>
          <div className="text-2xl font-black text-white tracking-widest mt-1 font-mono">
            {user?.referralCode || 'N/A'}
          </div>
          <p className="text-xs text-indigo-200/80 mt-1">
            Share this code with your contacts. When they register, they will be mapped directly to your referral tree.
          </p>
        </div>

        <AppButton
          variant="primary"
          onClick={handleCopyCode}
          className="whitespace-nowrap bg-indigo-600 hover:bg-indigo-500"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-1.5 text-emerald-400" />
              Copied to Clipboard
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1.5" />
              Copy Referral Code
            </>
          )}
        </AppButton>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('direct')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'direct'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Direct Referrals
        </button>
        <button
          onClick={() => setActiveTab('tree')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'tree'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <GitFork className="w-4 h-4" />
          Referral Tree
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'income'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Commission Income
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'direct' && (
        <div>
          {isDirectLoading ? (
            <div className="py-16 flex justify-center">
              <LoadingSpinner message="Loading direct referrals..." />
            </div>
          ) : directError ? (
            <ErrorMessage title="Failed to load direct referrals" message={directError.message} />
          ) : directList.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Direct Referrals Yet"
              description="Share your referral code to invite partners and build your downline team."
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3">User Name</th>
                      <th className="px-6 py-3">Referral Code</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {directList.map((ref) => (
                      <tr key={ref._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{ref.name}</td>
                        <td className="px-6 py-4 font-mono text-indigo-300">{ref.referralCode}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            {ref.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(ref.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tree' && (
        <div>
          {isTreeLoading ? (
            <div className="py-16 flex justify-center">
              <LoadingSpinner message="Calculating referral tree..." />
            </div>
          ) : treeError ? (
            <ErrorMessage title="Failed to load referral tree" message={treeError.message} />
          ) : !treeRoot ? (
            <EmptyState
              icon={GitFork}
              title="Tree Empty"
              description="No downline nodes found for your account."
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h4 className="text-sm font-semibold text-white mb-4">Hierarchical Downline (Up to 5 Levels)</h4>
              <div className="font-mono text-xs text-slate-300 bg-slate-950 p-4 rounded-lg overflow-x-auto border border-slate-800">
                <pre>{JSON.stringify(treeRoot, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'income' && (
        <div>
          {isIncomeLoading ? (
            <div className="py-16 flex justify-center">
              <LoadingSpinner message="Loading referral income records..." />
            </div>
          ) : incomeError ? (
            <ErrorMessage title="Failed to load referral income" message={incomeError.message} />
          ) : incomeList.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No Commission Income Yet"
              description="Referral commissions will appear here once downline members invest or generate ROI."
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3">Level</th>
                      <th className="px-6 py-3">Commission Amount</th>
                      <th className="px-6 py-3">Basis Amount</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {incomeList.map((inc) => (
                      <tr key={inc._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-indigo-400">Level {inc.level}</td>
                        <td className="px-6 py-4 font-semibold text-emerald-400">
                          {formatPaise(inc.commissionAmountPaise)}
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {formatPaise(inc.basisAmountPaise)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            {inc.status || 'CREDITED'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(inc.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

