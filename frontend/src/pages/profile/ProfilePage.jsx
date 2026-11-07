import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { logout, selectCurrentUser } from '../../features/auth/authSlice';
import { useGetMeQuery } from '../../features/auth/authApi';
import { baseApi } from '../../app/api/baseApi';
import {
  formatBusinessDate,
  formatDateTime
} from '../../utils/formatters';
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  LogOut,
  Copy,
  Check,
  Share2,
  Link as LinkIcon,
  RefreshCw,
  Lock,
  ShieldCheck,
  ArrowRight,
  Info
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
 * Displays verified account properties, technical identifiers, referral credentials,
 * and authenticated session termination under institutional fintech styling.
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
    // 2. Clear all cached RTK Query data to prevent data leakage across sessions
    dispatch(baseApi.util.resetApiState());
    // 3. Redirect to login
    navigate('/login', { replace: true });
  };

  const referralUrl = user?.referralCode
    ? `${window.location.origin}/register?ref=${user.referralCode}`
    : '';

  const initials = getInitials(user?.name);
  const roleLabel = user?.role === 'admin' ? 'ADMIN' : 'INVESTOR';
  const userId = user?.id || user?._id || '';

  return (
    <div className="space-y-6 max-w-4xl mx-auto min-w-0">
      {/* Page Header */}
      <PageHeader
        title="Account Profile"
        subtitle="Review verified credentials, technical account identifiers, and session security status"
        actions={
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium bg-surface-card border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors disabled:opacity-50 shadow-sm"
            title="Refresh profile information"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-brand-primary' : ''}`}
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

      {/* 1. Account Overview Header Card */}
      <div className="bg-surface-card border border-border-subtle rounded-card p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-border-subtle">
          <div className="flex items-center gap-4 min-w-0">
            {/* Avatar with Initials */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-card bg-surface-elevated border border-border-strong flex items-center justify-center font-bold text-xl sm:text-2xl text-brand-primary tracking-wider shrink-0 select-none">
              {initials}
            </div>

            {/* Name, Email, and Badges */}
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight truncate">
                  {user?.name || 'Account Holder'}
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-elevated text-indigo-400 border border-border-subtle uppercase tracking-wider">
                  {roleLabel}
                </span>
                <StatusBadge
                  status={user?.isActive ? 'active' : 'completed'}
                  label={user?.isActive ? 'ACTIVE' : 'INACTIVE'}
                  size="sm"
                />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Mail className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="truncate">{user?.email || '—'}</span>
                </div>
                {user?.mobileNumber && (
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-text-secondary">
                    <Phone className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <span>{user.mobileNumber}</span>
                  </div>
                )}
              </div>

              {user?.createdAt && (
                <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                  <Calendar className="w-3 h-3 text-text-muted shrink-0" />
                  <span>Member since {formatBusinessDate(user.createdAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Sign Out Action */}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-button text-xs font-semibold text-semantic-danger bg-semantic-danger/10 hover:bg-semantic-danger hover:text-white border border-semantic-danger/25 transition-all self-start sm:self-auto shrink-0 shadow-sm"
            title="Terminate active session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Quick Summary Highlights Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5 text-xs">
          <div className="p-3.5 bg-surface-canvas rounded-card border border-border-subtle">
            <span className="text-[10px] uppercase font-semibold text-text-muted block tracking-wider">
              Assigned Role
            </span>
            <span className="text-sm font-semibold text-text-primary mt-0.5 block">
              {user?.role === 'admin' ? 'Admin' : 'Investor'}
            </span>
          </div>

          <div className="p-3.5 bg-surface-canvas rounded-card border border-border-subtle">
            <span className="text-[10px] uppercase font-semibold text-text-muted block tracking-wider">
              Referral Code
            </span>
            <span className="text-sm font-mono font-bold text-indigo-400 mt-0.5 block">
              {user?.referralCode || 'N/A'}
            </span>
          </div>

          <div className="p-3.5 bg-surface-canvas rounded-card border border-border-subtle">
            <span className="text-[10px] uppercase font-semibold text-text-muted block tracking-wider">
              Account Standing
            </span>
            <span className="text-sm font-semibold text-brand-primary mt-0.5 block">
              {user?.isActive ? 'Active & Verified' : 'Deactivated'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Personal Information (Verified & Read-Only) */}
      <div className="bg-surface-card border border-border-subtle rounded-card overflow-hidden shadow-sm">
        <div className="px-5 sm:px-6 py-4 border-b border-border-subtle bg-surface-elevated/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-brand-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Personal Information</h3>
          </div>
          <span className="text-[11px] text-text-muted font-medium bg-surface-canvas px-2.5 py-0.5 rounded-full border border-border-subtle">
            Verified · Read-Only
          </span>
        </div>

        <div className="divide-y divide-border-subtle text-xs">
          {/* Full Legal Name */}
          <div className="px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-text-secondary font-medium">Full Legal Name</span>
            <span className="text-text-primary font-semibold">{user?.name || '—'}</span>
          </div>

          {/* Email Address */}
          <div className="px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-text-secondary font-medium">Registered Email</span>
            <span className="text-text-primary font-mono">{user?.email || '—'}</span>
          </div>

          {/* Registered Mobile Number */}
          <div className="px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-text-secondary font-medium">Registered Mobile</span>
            <span className={user?.mobileNumber ? 'text-text-primary font-mono' : 'text-text-muted italic'}>
              {user?.mobileNumber || 'Not provided'}
            </span>
          </div>

          {/* Registration Date */}
          <div className="px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-text-secondary font-medium">Registration Date</span>
            <span className="text-text-primary font-tabular tabular-nums">
              {formatDateTime(user?.createdAt)}
            </span>
          </div>
        </div>

        {/* Read-only notification footer */}
        <div className="px-5 sm:px-6 py-3 bg-surface-canvas/60 border-t border-border-subtle flex items-start gap-2.5 text-[11px] text-text-muted">
          <Info className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
          <span>
            Personal identity credentials are verified upon registration for AML/KYC audit compliance. Client-side modifications are locked.
          </span>
        </div>
      </div>

      {/* 3. Account & Platform Specifications */}
      <div className="bg-surface-card border border-border-subtle rounded-card overflow-hidden shadow-sm">
        <div className="px-5 sm:px-6 py-4 border-b border-border-subtle bg-surface-elevated/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-text-primary">Account Specifications</h3>
          </div>
          <span className="text-[11px] text-text-muted font-mono">
            Immutable Identity
          </span>
        </div>

        <div className="divide-y divide-border-subtle text-xs">
          {/* User Account ID */}
          <div className="px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-text-secondary font-medium">User Identifier</span>
            <div className="flex items-center gap-2">
              <span className="text-text-primary font-mono select-all">
                {userId || '—'}
              </span>
              {userId && (
                <button
                  type="button"
                  onClick={() => handleCopy(userId, setCopiedId)}
                  className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-elevated transition-colors"
                  title="Copy User ID"
                >
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-brand-primary" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Authorization Role */}
          <div className="px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-text-secondary font-medium">Authorization Role</span>
            <span className="text-text-primary font-semibold">
              {user?.role === 'admin' ? 'Admin' : 'Investor'}
            </span>
          </div>

          {/* Account Status */}
          <div className="px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-text-secondary font-medium">Account Status</span>
            <div>
              <StatusBadge
                status={user?.isActive ? 'active' : 'completed'}
                label={user?.isActive ? 'ACTIVE' : 'INACTIVE'}
                size="sm"
              />
            </div>
          </div>

          {/* Sponsor Mapping */}
          <div className="px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-text-secondary font-medium">Sponsor Mapping</span>
            <span className="text-text-secondary">
              {user?.referredBy ? (
                <span className="font-mono text-text-primary">ID: {user.referredBy}</span>
              ) : (
                <span className="italic text-text-muted">Direct Platform Registration (Root)</span>
              )}
            </span>
          </div>

          {/* Last Profile Synchronization */}
          <div className="px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-text-secondary font-medium">Last Profile Synchronization</span>
            <span className="text-text-secondary font-tabular tabular-nums">
              {formatDateTime(user?.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Referral Identity & Link Sharing */}
      {user?.referralCode && (
        <div className="bg-surface-card border border-border-subtle rounded-card p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-brand-primary" />
              <h3 className="text-sm font-semibold text-text-primary">Affiliate Referral Tools</h3>
            </div>
            <Link
              to="/referrals"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:text-brand-hover transition-colors"
            >
              <span>Open Referral Management</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed">
            Your unique referral code links prospective affiliates directly to your downline network. Share either your personal code or direct registration link to invite new members.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Box 1: Code */}
            <div className="p-3.5 bg-surface-canvas border border-border-subtle rounded-card flex items-center justify-between min-w-0">
              <div className="min-w-0 mr-2">
                <span className="text-[10px] uppercase font-semibold text-text-muted block tracking-wider">
                  Referral Code
                </span>
                <span className="text-base font-mono font-bold text-text-primary tracking-wider mt-0.5 block truncate">
                  {user.referralCode}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(user.referralCode, setCopiedCode)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium bg-surface-elevated hover:bg-surface-card-hover text-text-primary border border-border-subtle transition-colors shrink-0"
                title="Copy referral code"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-brand-primary" />
                    <span className="text-brand-primary font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-text-secondary" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Box 2: Link */}
            <div className="p-3.5 bg-surface-canvas border border-border-subtle rounded-card flex items-center justify-between min-w-0">
              <div className="truncate min-w-0 flex-1 mr-3">
                <span className="text-[10px] uppercase font-semibold text-text-muted block tracking-wider">
                  Registration URL
                </span>
                <span className="text-xs font-mono text-text-secondary truncate block mt-0.5">
                  {referralUrl}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(referralUrl, setCopiedLink)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-semibold bg-brand-primary hover:bg-brand-hover active:bg-emerald-700 text-brand-primary-foreground transition-all shrink-0 shadow-sm"
                title="Copy registration link"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Link Copied!</span>
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

      {/* 5. Session Security & Governance */}
      <div className="bg-surface-card border border-border-subtle rounded-card p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Authentication & Session Security</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
          <div className="p-3.5 bg-surface-canvas rounded-card border border-border-subtle">
            <span className="text-[10px] uppercase font-semibold text-text-muted block tracking-wider">
              Session Mechanism
            </span>
            <span className="text-xs font-mono text-brand-primary mt-1 block font-medium">
              JWT Bearer (HTTP Header)
            </span>
            <span className="text-[11px] text-text-secondary mt-0.5 block">
              Cryptographically signed token
            </span>
          </div>

          <div className="p-3.5 bg-surface-canvas rounded-card border border-border-subtle">
            <span className="text-[10px] uppercase font-semibold text-text-muted block tracking-wider">
              Token Invalidation
            </span>
            <span className="text-xs text-text-primary mt-1 block font-semibold">
              Purged on Sign Out
            </span>
            <span className="text-[11px] text-text-secondary mt-0.5 block">
              Storage & state cache cleared
            </span>
          </div>

          <div className="p-3.5 bg-surface-canvas rounded-card border border-border-subtle">
            <span className="text-[10px] uppercase font-semibold text-text-muted block tracking-wider">
              Security Boundary
            </span>
            <span className="text-xs text-text-primary mt-1 block font-semibold">
              Server-Enforced RBAC
            </span>
            <span className="text-[11px] text-text-secondary mt-0.5 block">
              Role verified on every request
            </span>
          </div>
        </div>

        {/* Read-Only Profile Policy Disclaimer */}
        <div className="bg-surface-canvas border border-border-subtle rounded-card p-4 flex items-start gap-3 text-xs text-text-secondary">
          <Lock className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-text-primary">
              Profile Immutability Policy
            </p>
            <p className="leading-relaxed">
              In accordance with NexaChain financial audit integrity guidelines, primary account properties (legal name, registered email, and sponsor linkage) are cryptographically anchored upon registration. Client-side profile mutations are restricted. To request a verified legal name or credential update, please reach out through authenticated administrative channels.
            </p>
          </div>
        </div>
      </div>

      {/* 6. Active Session Termination */}
      <div className="bg-surface-card border border-border-subtle rounded-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-text-primary">Terminate Active Session</h4>
          <p className="text-xs text-text-secondary">
            Signing out clears your local access token and purges the application state cache.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-button text-xs font-semibold text-semantic-danger bg-semantic-danger/10 hover:bg-semantic-danger hover:text-white border border-semantic-danger/25 transition-all shrink-0 shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of NexaChain</span>
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
