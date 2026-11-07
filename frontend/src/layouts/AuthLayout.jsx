import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Layers,
  Share2,
  Zap,
  LogIn,
  UserPlus
} from 'lucide-react';

/**
 * AuthLayout Component
 * 
 * Implements the NexaChain institutional capital platform specification:
 * - Left column: Institutional branding, PROD v1.4 tag, feature capsule,
 *   compelling typography, multi-tier downline architecture matrix card, and trust footer.
 * - Right column: Floating segmented control (Sign In / Create Account),
 *   high-density fintech card with subtle borders, and bottom security badge.
 */
export const AuthLayout = () => {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div className="min-h-screen lg:h-screen bg-[#070b14] text-white flex flex-col lg:flex-row font-sans selection:bg-emerald-500/30 selection:text-white relative overflow-x-hidden lg:overflow-hidden">
      {/* LEFT COLUMN: Fixed Viewport Height Brand Showcase */}
      <div className="w-full lg:w-1/2 xl:w-5/12 lg:h-full flex flex-col justify-between p-6 sm:p-8 lg:p-8 xl:p-12 border-b lg:border-b-0 lg:border-r border-[#151d30] bg-[#070b14] z-10 select-none lg:overflow-y-auto">
        {/* Top Header Row: Logo */}
        <div className="flex items-center justify-between gap-4 shrink-0">
          <Link
            to="/login"
            className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0c1624] border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
              <Layers className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white block leading-none">
                  NexaChain
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                  PROD v1.4
                </span>
              </div>
              <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-slate-400 font-medium block mt-1">
                Institutional Capital Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Middle Hero Showcase: Headline, Description, and Tier Matrix */}
        <div className="my-auto py-6 space-y-5 max-w-xl shrink-0">
          {/* Section Tag Capsule */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#09151e] border border-emerald-500/40 text-emerald-400 text-xs font-mono font-semibold tracking-wider uppercase select-none">
            <Share2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Multi-Level Affiliate Network • Integer-Paise Precision</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
            Automated Daily ROI
            <span className="block mt-1">&amp; Multi-Tier</span>
            <span className="block mt-1 text-emerald-400">
              Affiliate Network.
            </span>
          </h1>

          {/* Description */}
          <p className="text-xs sm:text-sm lg:text-base text-slate-400 leading-relaxed max-w-lg">
            Monitor institutional investment tranches with automated daily compounding yields and inspect multi-generational downline allocations with immutable integer-level mathematical precision.
          </p>

          {/* Multi-Tier Downline Architecture Card */}
          <div className="bg-[#0c1220] border border-[#1b253b] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="uppercase font-mono font-semibold tracking-wider text-slate-400 text-[11px]">
                Multi-Tier Downline Architecture
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
                <Zap className="w-3 h-3 text-emerald-400" />
                Audited Calculations
              </span>
            </div>

            {/* Matrix Rows */}
            <div className="space-y-2 font-sans">
              {/* Tier 1 */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#070b16] border border-[#1b253b] hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-500/50">
                    Tier 1
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-white">
                      Direct Sponsor Downline
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Directly referred capital nodes
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-emerald-400">
                  Level 1 Direct
                </span>
              </div>

              {/* Tier 2 */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#070b16] border border-[#1b253b] hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-900 text-slate-400 border border-slate-700">
                    Tier 2
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-200">
                      Secondary Network
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Tier 2 propagated referral yield
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-400">
                  Level 2 Network
                </span>
              </div>

              {/* Tier 3-5 */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#070b16] border border-[#1b253b] hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-900 text-slate-400 border border-slate-700">
                    Tier 3-5
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-200">
                      Generational Downline
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Deep decentralized multi-tier yield
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-400">
                  Levels 3 to 5
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Indicators */}
        <div className="pt-4 border-t border-[#1b253b] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-slate-300 text-xs font-medium">
              <span className="text-emerald-400 font-bold">✓</span>
              Integer Paise Precision
            </span>
            <span className="text-slate-600">•</span>
            <span className="inline-flex items-center gap-1.5 text-slate-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              Audited Daily Settlements
            </span>
          </div>
          <span className="text-slate-500 font-mono text-[11px]">
            © 2026 NexaChain Labs
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: Floating Switcher, Auth Card, and Security Badge */}
      <div className="w-full lg:w-1/2 xl:w-7/12 lg:h-full flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 xl:p-12 z-10 bg-[#090D16] lg:overflow-y-auto">
        <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center my-auto py-4 sm:py-6">
          {/* Top Segmented Tab Switcher (Floating above card) */}
          <div className="w-full mb-4 sm:mb-5">
            <div className="grid grid-cols-2 p-1.5 bg-[#0b101d] border border-[#1b253b] rounded-2xl">
              <Link
                to="/login"
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isLogin
                    ? 'bg-[#101726] text-white border border-slate-700/80 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  !isLogin
                    ? 'bg-[#101726] text-white border border-slate-700/80 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </Link>
            </div>
          </div>

          {/* Main Card */}
          <div className="w-full bg-[#0c1322] border border-[#1b253b] rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-9 shadow-2xl shadow-black/60 relative">
            {/* Render Routed Component (LoginPage or RegisterPage) */}
            <Outlet />
          </div>

          {/* Bottom Security Footer Pill */}
          <div className="mt-4 sm:mt-5 flex items-center justify-center select-none">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#080d19] border border-[#1b253b] text-slate-400 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Ledger Integrity SHA-256 • TLS 1.3 End-to-End</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;