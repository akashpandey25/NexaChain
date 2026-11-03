import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { useAppSelector } from '../../app/store';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { User, Mail, Shield, Key, Calendar, Wallet } from 'lucide-react';

const formatPaise = (paise = 0) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(paise / 100);
};

export const ProfilePage = () => {
  const user = useAppSelector(selectCurrentUser);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Account Profile"
        subtitle="Manage your personal credentials, referral code, and security settings"
      />

      {/* User Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-2xl">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{user?.name}</h3>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                {user?.role || 'INVESTOR'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                {user?.status || 'ACTIVE'}
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-xs">
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Key className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold uppercase">Referral Code</span>
            </div>
            <div className="text-base font-bold text-white font-mono tracking-wider">
              {user?.referralCode || 'N/A'}
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Wallet className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold uppercase">Wallet Balance</span>
            </div>
            <div className="text-base font-bold text-cyan-400">
              {formatPaise(user?.walletBalancePaise || 0)}
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold uppercase">Joined Date</span>
            </div>
            <div className="text-base font-medium text-white">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="font-semibold uppercase">Account Security</span>
            </div>
            <div className="text-base font-medium text-emerald-400">
              JWT Bearer Verified
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

