import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Layers,
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
 * Provides 100% consistent desktop layout with zero layout shifts:
 * - Desktop Viewport Locked (`lg:h-screen lg:overflow-hidden`): Prevents browser-level
 *   vertical scrollbars from appearing and shifting the page horizontally.
 * - Left Column (`lg:h-full overflow-hidden`): Non-scrolling, compact brand showcase
 *   that comfortably fits on any display height without overflowing or showing scrollbars.
 * - Right Column (`lg:h-full lg:overflow-y-auto justify-start pt-6 sm:pt-8 lg:pt-10`):
 *   Anchored at an identical top offset so the Tab Switcher, Title, and Subtitle
 *   never shift, jump, or change margins/padding when toggling between Sign In and Create Account.
 */
export const AuthLayout = () => {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div className="min-h-screen lg:h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden lg:overflow-hidden">
      {/* Background Ambient Glows */}
      <div
        className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[160px] pointer-events-none"
        aria-hidden="true"
      />

      {/* LEFT COLUMN: Fixed Viewport Height, Non-Scrolling Brand Showcase */}
      <div className="w-full lg:w-1/2 xl:w-5/12 lg:h-full flex flex-col justify-between p-6 sm:p-8 lg:p-8 xl:p-10 border-b lg:border-b-0 lg:border-r border-slate-900/80 bg-slate-950/60 backdrop-blur-md z-10 select-none overflow-hidden">
        {/* Top Header Row: Logo */}
        <div className="flex items-center justify-between gap-4 shrink-0">
          <Link
            to="/login"
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-2xl"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white block">
                NexaChain
              </span>
              <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-400 font-semibold block -mt-0.5">
                Capital Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Middle Hero Showcase: Headline, Description, and Tier Matrix */}
        <div className="my-auto py-3 space-y-3.5 max-w-xl shrink-0">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 text-[10px] font-bold tracking-widest uppercase">
            <Share2 className="w-3 h-3 text-emerald-400" />
            <span>Multi-Level Affiliate Network</span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-[1.2]">
            Automated Daily{' '}
            <span className="block">ROI & Multi-Tier</span>
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Affiliate Network.
            </span>
          </h1>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed max-w-lg">
            Monitor investment packages with automated daily compounding yields and inspect multi-generational affiliate networks with integer precision.
          </p>

          {/* Multi-Tier Affiliate Hierarchy Card */}
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 shadow-xl space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase font-bold tracking-wider text-slate-400 text-[10px]">
                Multi-Tier Affiliate Hierarchy
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-800/60 text-emerald-400 text-[10px] font-semibold">
                <Zap className="w-3 h-3 text-emerald-400" />
                Audited Calculations
              </span>
            </div>

            {/* Matrix Rows */}
            <div className="space-y-1.5 font-sans">
              {/* Tier 1 */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800/60 hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[9px] font-extrabold uppercase">
                    Tier 1
                  </span>
                  <span className="text-xs font-medium text-slate-200">
                    Direct Sponsor Downline
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-emerald-400">
                  Level 1 Direct
                </span>
              </div>

              {/* Tier 2 */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800/60 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[9px] font-bold uppercase">
                    Tier 2
                  </span>
                  <span className="text-xs font-medium text-slate-300">
                    Secondary Network
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-slate-300">
                  Level 2 Network
                </span>
              </div>

              {/* Tier 3-5 */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800/60 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[9px] font-bold uppercase">
                    Tier 3-5
                  </span>
                  <span className="text-xs font-medium text-slate-300">
                    Generational Downline
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-slate-400">
                  Levels 3 to 5
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Indicators */}
        <div className="pt-3 border-t border-slate-900/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-slate-300 text-[11px]">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Integer Paise Precision
            </span>
            <span className="text-slate-700">•</span>
            <span className="inline-flex items-center gap-1.5 text-slate-300 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Audited Daily Settlements
            </span>
          </div>
          <span className="text-slate-500 font-mono text-[10px]">
            © 2026 NexaChain
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: Consistent Top-Aligned Auth Card Container */}
      <div className="w-full lg:w-1/2 xl:w-7/12 lg:h-full flex flex-col justify-start items-center p-4 sm:p-6 lg:p-8 pt-6 sm:pt-8 lg:pt-10 xl:pt-12 z-10 lg:overflow-y-auto">
        <div className="w-full max-w-xl space-y-4 pb-6">
          {/* Main Card with Backdrop Glow */}
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-5 sm:p-7 lg:p-8 shadow-2xl shadow-emerald-950/30 relative">
            {/* Top Segmented Tab Switcher */}
            <div className="grid grid-cols-2 p-1 bg-slate-950/90 border border-slate-800/80 rounded-xl mb-5">
              <Link
                to="/login"
                className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${isLogin
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${!isLogin
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
          {/* <div className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-[10px] sm:text-[11px] text-slate-400 shadow-sm mx-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>256-Bit Encrypted & JWT Verified Session</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400/90 font-medium">Instant Vault Provisioning</span>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
