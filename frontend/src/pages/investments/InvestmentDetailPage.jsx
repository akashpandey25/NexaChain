import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { AppButton } from '../../components/common/AppButton';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';
import { useGetInvestmentByIdQuery } from '../../features/investments/investmentApi';
import { ArrowLeft, PiggyBank, Calendar, TrendingUp, ShieldCheck } from 'lucide-react';

const formatPaise = (paise = 0) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(paise / 100);
};

export const InvestmentDetailPage = () => {
  const { id } = useParams();
  const { data, isLoading, error, refetch } = useGetInvestmentByIdQuery(id);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Loading investment details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/investments" className="inline-flex items-center text-xs text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Investments
        </Link>
        <ErrorMessage
          title="Could not load investment"
          message={error.message}
          onRetry={refetch}
        />
      </div>
    );
  }

  const investment = data?.data || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/investments" className="inline-flex items-center text-xs text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Investments
        </Link>
      </div>

      <PageHeader
        title={`Investment: ${investment.planName || 'Package'}`}
        subtitle={`ID: ${investment._id}`}
        action={
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              investment.status === 'ACTIVE'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {investment.status}
          </span>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Principal Amount</span>
            <PiggyBank className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatPaise(investment.principalAmountPaise)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Locked in yield generation contract
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total ROI Generated</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {formatPaise(investment.totalRoiEarnedPaise || 0)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Credited directly to available wallet
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Status & Verification</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {investment.status}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Verified on-chain contract
          </div>
        </div>
      </div>

      {/* Meta Details Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h4 className="text-sm font-semibold text-white">Investment Information</h4>
        </div>
        <div className="divide-y divide-slate-800 text-xs">
          <div className="px-6 py-3 flex justify-between">
            <span className="text-slate-400">Investment ID</span>
            <span className="text-white font-mono">{investment._id}</span>
          </div>
          <div className="px-6 py-3 flex justify-between">
            <span className="text-slate-400">Plan Identifier</span>
            <span className="text-white font-medium">{investment.planName}</span>
          </div>
          <div className="px-6 py-3 flex justify-between">
            <span className="text-slate-400">Created Date</span>
            <span className="text-white">
              {investment.createdAt ? new Date(investment.createdAt).toLocaleString() : 'N/A'}
            </span>
          </div>
          <div className="px-6 py-3 flex justify-between">
            <span className="text-slate-400">Last ROI Calculation Date</span>
            <span className="text-white">
              {investment.lastRoiDate ? new Date(investment.lastRoiDate).toLocaleDateString() : 'Pending Next Cron Run'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

