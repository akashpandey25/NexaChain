import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Layers,
  Gift,
  Share2,
  Zap,
  Lock,
  CheckCircle2,
  ShieldCheck,
  LogIn,
  UserPlus
} from 'lucide-react';

/**
 * AuthLayout Component
 * 
 * Implements the premium dark fintech split layout:
 * - Left Column: Brand showcase, institutional quote, value proposition,
 *   and Multi-Tier Reward Matrix.
 * - Right Column: Authenticated card container with segmented tab switcher
 *   (Sign In / Create Account) and 256-bit security badge.
 */
export const AuthLayout = () => {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div
        className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[160px] pointer-events-none"
        aria-hidden="true"
      />

      {/* LEFT COLUMN: Brand Ecosystem & Value Proposition Showcase */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-between p-6 sm:p-10 lg:p-14 border-b lg:border-b-0 lg:border-r border-slate-900/80 bg-slate-950/60 backdrop-blur-md z-10">
        {/* Top Header Row: Logo & Referral Boost Pill */}
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/login"
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-2xl"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white block">
                NexaChain
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-semibold block -mt-0.5">
                Partner Network
              </span>
            </div>
          </Link>

          {/* Top-Right Badge: +2.5% Referral Boost */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-sm">
            <Gift className="w-3.5 h-3.5 text-emerald-400" />
            <span>+2.5% Referral Boost</span>
          </div>
        </div>

        {/* Middle Hero Showcase: Headline, Quote, and Reward Matrix */}
        <div className="my-10 lg:my-auto space-y-6 max-w-xl">
          {/* Ecosystem Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 text-[11px] font-bold tracking-widest uppercase">
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>5-Tier Partner Ecosystem</span>
          </div>

          {/* Bold Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
            Start Earning Daily{' '}
            <span className="block">ROI & Multi-Tier</span>
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Partner Rewards.
            </span>
          </h1>

          {/* Quote / Value Proposition */}
          <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed">
            Create your institutional vault in under 60 seconds. Earn automated daily yield
            plus instant on-chain referral rebates across 5 network levels.
          </p>

          {/* Multi-Tier Reward Matrix Card */}
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase font-bold tracking-wider text-slate-400 text-[11px]">
                Multi-Tier Reward Matrix
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-800/60 text-emerald-400 text-[10px] font-semibold">
                <Zap className="w-3 h-3 text-emerald-400" />
                Instant Settlement
              </span>
            </div>

            {/* Matrix Rows */}
            <div className="space-y-2 font-sans">
              {/* Tier 1 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60 hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase">
                    Tier 1
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-slate-200">
                    Direct Partner Invite
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400">
                  8.0% Commission
                </span>
              </div>

              {/* Tier 2 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold uppercase">
                    Tier 2
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-slate-300">
                    Secondary Network
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-mono font-bold text-slate-300">
                  4.0% Commission
                </span>
              </div>

              {/* Tier 3-5 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold uppercase">
                    Tier 3-5
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-slate-300">
                    Extended Syndicate
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-mono font-bold text-slate-400">
                  3.0% Combined
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Indicators */}
        <div className="pt-6 border-t border-slate-900/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Zero-Fee Onboarding
            </span>
            <span className="text-slate-700">•</span>
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              KYC-Free Up to $50K
            </span>
          </div>
          <span className="text-slate-500 font-mono text-[11px]">
            © 2026 NexaChain
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: The Auth Card Container */}
      <div className="w-full lg:w-1/2 xl:w-7/12 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 z-10">
        <div className="w-full max-w-xl space-y-5">
          {/* Main Card with Backdrop Glow */}
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl shadow-emerald-950/30 relative">
            {/* Top Segmented Tab Switcher */}
            <div className="grid grid-cols-2 p-1 bg-slate-950/90 border border-slate-800/80 rounded-xl mb-6">
              <Link
                to="/login"
                className={`py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  isLogin
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className={`py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  !isLogin
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </Link>
            </div>

            {/* Render Routed Component (LoginPage or RegisterPage) */}
            <Outlet />
          </div>

          {/* Security Verification Badge Pill */}
          <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-slate-900/60 border border-slate-800 text-[11px] sm:text-xs text-slate-400 shadow-sm mx-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>256-Bit Encrypted & JWT Verified Session</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400/90 font-medium">Instant Vault Provisioning</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
