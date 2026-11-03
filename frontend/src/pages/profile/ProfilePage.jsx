import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { logout, selectCurrentUser } from '../../features/auth/authSlice';
import { useGetMeQuery } from '../../features/auth/authApi';
import { baseApi } from '../../app/api/baseApi';
import {
  formatBusinessDate,
  formatDateTime,
  getStatusStyle
} from '../../utils/formatters';
import {
  User,
  Mail,
  Shield,
  Key,
  Calendar,
  LogOut,
  Copy,
  Check,
  Share2,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Lock,
  Clock,
  ShieldCheck
} from 'lucide-react';

/**
 * Derives clean 2-letter uppercase initials from user's full name.
 * @param {string} name Full name
 * @returns {string} 1-2 uppercase characters
 */
const getInitials = (name = '') => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * User Profile and Account Information Page
 * Displays verified account properties, referral credentials, session state,
 * and secure session termination.
 */
export const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const reduxUser = useAppSelector(selectCurrentUser);

  // Fetch authoritative user profile from GET /api/auth/me
  const { data, isLoading, isFetching, error, refetch } = useGetMeQuery();

  const [copiedId, setCopiedId] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Combine fresh API response with Redux cached user
  const user = data?.data?.user || reduxUser || {};

  const handleCopy = (text, setCopiedState) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const handleLogout = () => {
    // 1. Clear credentials in Redux & localStorage
    dispatch(logout());
    // 2. Clear all cached RTK Query data to prevent data leakage
    dispatch(baseApi.util.resetApiState());
    // 3. Redirect to login
    navigate('/login', { replace: true });
  };

  const referralUrl = user?.referralCode
    ? `${window.location.origin}/register?ref=${user.referralCode}`
    : '';

  const initials = getInitials(user?.name);
  const statusStyle = getStatusStyle(user?.isActive ? 'active' : 'cancelled');
  const roleLabel = (user?.role || 'investor').toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Account Profile"
        subtitle="Manage your personal credentials, referral codes, and security preferences"
        actions={
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh profile information"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-emerald-400' : ''}`}
            />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Error Banner */}
      {error && (
        <ErrorMessage
          title="Could Not Synchronize Profile"
          message={
            error?.data?.message ||
            error?.message ||
            'Unable to fetch the latest profile data from the authentication service.'
          }
          errors={error?.data?.errors}
          onRetry={refetch}
        />
      )}

      {/* 1. Profile Overview Header Card */}
      <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-xl transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            {/* Avatar with Initials */}
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-emerald-600/30 to-indigo-600/30 border border-emerald-500/40 flex items-center justify-center font-bold text-2xl text-emerald-300 tracking-wider shadow-inner shrink-0">
              {initials}
            </div>

            {/* Name, Email, and Badges */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {user?.name || 'Account Holder'}
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 uppercase">
                  {roleLabel}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${statusStyle.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                  {user?.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{user?.email || '—'}</span>
              </div>

              {user?.createdAt && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Calendar className="w-3 h-3 text-slate-600" />
                  <span>Member since {formatBusinessDate(user.createdAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Logout Header Action */}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 transition-colors self-start sm:self-auto shrink-0 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Quick Summary Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 text-xs">
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Assigned Role
            </span>
            <span className="text-sm font-semibold text-white mt-0.5 block capitalize">
              {user?.role || 'Investor'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Referral Code
            </span>
            <span className="text-sm font-mono font-bold text-indigo-300 mt-0.5 block">
              {user?.referralCode || 'N/A'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Account Status
            </span>
            <span className="text-sm font-semibold text-emerald-400 mt-0.5 block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified & Active
            </span>
          </div>
        </div>
      </div>

      {/* 2. Detailed Account Information Section */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Account Specifications</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Immutable Identity
          </span>
        </div>

        <div className="divide-y divide-slate-800/60 text-xs">
          {/* Full Name */}
          <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-slate-400 font-medium">Full Name</span>
            <span className="text-white font-semibold">{user?.name || '—'}</span>
          </div>

          {/* Email Address */}
          <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-slate-400 font-medium">Email Address</span>
            <span className="text-slate-200 font-mono">{user?.email || '—'}</span>
          </div>

          {/* User Account ID */}
          <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-slate-400 font-medium">User Identifier</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-mono">{user?.id || user?._id || '—'}</span>
              {(user?.id || user?._id) && (
                <button
                  type="button"
                  onClick={() => handleCopy(user.id || user._id, setCopiedId)}
                  className="text-slate-500 hover:text-slate-300 p-0.5 transition-colors"
                  title="Copy User ID"
                >
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Referral Code */}
          <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-slate-400 font-medium">Affiliate Referral Code</span>
            <span className="text-indigo-300 font-mono font-bold">{user?.referralCode || '—'}</span>
          </div>

          {/* Sponsor Reference */}
          <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-slate-400 font-medium">Sponsor Mapping</span>
            <span className="text-slate-400">
              {user?.referredBy ? (
                <span className="font-mono text-slate-300">ID: {user.referredBy}</span>
              ) : (
                <span className="italic text-slate-500">Direct Platform Registration (Root)</span>
              )}
            </span>
          </div>

          {/* Account Role */}
          <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-slate-400 font-medium">Authorization Role</span>
            <span className="text-white capitalize">{user?.role || 'Investor'}</span>
          </div>

          {/* Registered Timestamp */}
          <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-slate-400 font-medium">Registration Date</span>
            <span className="text-slate-300">{formatDateTime(user?.createdAt)}</span>
          </div>

          {/* Last Record Update */}
          <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-slate-400 font-medium">Last Profile Synchronization</span>
            <span className="text-slate-300">{formatDateTime(user?.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* 3. Referral Information & Link Sharing Card */}
      {user?.referralCode && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Affiliate Referral Tools</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Your unique referral code allows prospective investors to join your network downline.
            Share either your code or direct registration link to expand your affiliate team.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Box 1: Code */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Referral Code
                </span>
                <span className="text-base font-mono font-bold text-white tracking-widest mt-0.5 block">
                  {user.referralCode}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(user.referralCode, setCopiedCode)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Box 2: Link */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="truncate mr-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Registration URL
                </span>
                <span className="text-xs font-mono text-slate-400 truncate block mt-0.5">
                  {referralUrl}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(referralUrl, setCopiedLink)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shrink-0 shadow-sm"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span className="font-semibold">Link Copied</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Authentication and Session Governance */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Authentication & Session Security</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Session Mechanism
            </span>
            <span className="text-xs font-mono text-emerald-400 mt-1 block font-medium">
              JWT Bearer (HTTP Header)
            </span>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Token Invalidation
            </span>
            <span className="text-xs text-slate-300 mt-1 block">
              Auto-purged on Sign Out
            </span>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Security Boundary
            </span>
            <span className="text-xs text-slate-300 mt-1 block">
              Server-Enforced RBAC
            </span>
          </div>
        </div>

        {/* Read-Only Profile Policy Disclaimer */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-400">
          <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-300">
              Profile Immutability Policy
            </p>
            <p className="leading-relaxed text-slate-400">
              In accordance with NexaChain financial audit integrity guidelines, primary account properties (legal name, registered email, and sponsor linkage) are cryptographically anchored upon registration. Client-side profile mutations are restricted. To request a verified legal name or KYC credential update, please reach out through authenticated administrative channels.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Logout & Session Termination */}
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">Terminate Active Session</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Signing out clears your local access token and purges the application state cache.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/50 transition-all shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of NexaChain</span>
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
