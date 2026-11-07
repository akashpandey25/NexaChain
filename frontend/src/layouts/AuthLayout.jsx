import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Layers,
  Link2,
  Zap,
  LogIn,
  UserPlus
} from 'lucide-react';

/**
 * AuthLayout Component
 * 
 * Recreates the Stitch Enterprise specification:
 * - Faint grid canvas background with zero vertical scrolling on desktop viewports.
 * - Left column: Enterprise branding, V2.6 ENTERPRISE tag, feature capsule,
 *   institutional headline, HIERARCHY DISTRIBUTION LEDGER with tier settlements & dual-signed telemetry.
 * - Right column: Contained card with integrated segmented switcher (Sign In / Create Account),
 *   high-contrast inputs, enterprise access CTA, and Mainnet node telemetry footer.
 */
export const AuthLayout = () => {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div
      className="min-h-screen lg:h-screen lg:max-h-screen bg-[#060a12] text-white flex flex-col lg:flex-row font-sans selection:bg-emerald-500/30 selection:text-white relative overflow-x-hidden lg:overflow-hidden"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(27, 38, 59, 0.2) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(27, 38, 59, 0.2) 1px, transparent 1px)
        `,
        backgroundSize: '44px 44px'
      }}
    >
      {/* LEFT COLUMN: Fixed Viewport Height Brand Showcase (Zero Scroll on Desktop) */}
      <div className="w-full lg:w-1/2 xl:w-5/12 lg:h-full flex flex-col justify-between p-6 sm:p-7 lg:p-7 xl:p-9 border-b lg:border-b-0 lg:border-r border-[#151d30] bg-[#060a12]/95 z-10 select-none lg:overflow-hidden">
        {/* Top Header Row: Logo */}
        <div className="flex items-center justify-between gap-4 shrink-0">
          <Link
            to="/login"
            className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0c1624] border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
              <Layers className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white block leading-none">
                  NexaChain
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/70 border border-emerald-500/40 text-emerald-400">
                  V2.6 ENTERPRISE
                </span>
              </div>
              <span className="text-[9px] uppercase font-mono tracking-[0.2em] text-slate-400 font-medium block mt-1">
                Capital &amp; Liquidity Protocol
              </span>
            </div>
          </Link>
        </div>

        {/* Middle Hero Showcase: Headline, Description, and Tier Matrix */}
        <div className="my-auto py-3 sm:py-4 space-y-3.5 xl:space-y-4 max-w-xl shrink-0">
          {/* Section Tag Capsule */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a1523] border border-[#152a38] text-slate-300 text-[11px] font-mono font-semibold tracking-wider uppercase select-none">
            <Link2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Multi-Level Affiliate Network • Infrastructure</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block ml-0.5"></span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-[1.15]">
            Automated Daily ROI &amp;
            <span className="block mt-1 text-emerald-400">
              Multi-Tier Affiliate Network.
            </span>
          </h1>

          {/* Description */}
          <p className="text-xs xl:text-sm text-slate-400 leading-relaxed max-w-lg">
            Monitor institutional investment tiers with automated daily compounding yields, integer-precision settlements, and real-time verifiable multi-generational downline distribution.
          </p>

          {/* Hierarchy Distribution Ledger Card */}
          <div className="bg-[#0a101d]/90 border border-[#1b263b] rounded-2xl p-3.5 xl:p-4 space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="uppercase font-mono font-semibold tracking-wider text-slate-300 text-[11px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                Hierarchy Distribution Ledger
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono">
                <Zap className="w-3 h-3 text-emerald-400" />
                Audited Calculations
              </span>
            </div>

            {/* Matrix Rows */}
            <div className="space-y-1.5 font-sans">
              {/* Tier 1 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#060b14] border border-[#1b263b] hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-950/70 text-emerald-400 border border-emerald-500/50">
                    Tier 1
                  </span>
                  <span className="text-xs font-semibold text-white">
                    Direct Sponsor Downline
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-semibold text-emerald-400">
                    5.0% Direct
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 ml-1 hidden sm:inline">
                    Daily Settlement
                  </span>
                </div>
              </div>

              {/* Tier 2 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#060b14] border border-[#1b263b] hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-900 text-slate-400 border border-slate-700">
                    Tier 2
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    Secondary Partner Network
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-semibold text-slate-300">
                    2.5% Allocation
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 ml-1 hidden sm:inline">
                    L2 Synchronized
                  </span>
                </div>
              </div>

              {/* Tier 3-5 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#060b14] border border-[#1b263b] hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-900 text-slate-400 border border-slate-700">
                    Tier 3-5
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    Generational Ecosystem Pool
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-semibold text-slate-300">
                    1.0% Dynamic
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 ml-1 hidden sm:inline">
                    Cascade Protocol
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom 3 Ledger Metric Columns */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1b263b]/70 select-none text-center sm:text-left">
              <div>
                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block">
                  Precision Unit
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-200 block mt-0.5">
                  Integer-Paise (0.01)
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block">
                  Cycle Time
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-400 block mt-0.5">
                  00:00:00 UTC
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block">
                  Audit Status
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-200 block mt-0.5">
                  Dual-Signed ✓
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Indicators */}
        <div className="pt-3 border-t border-[#1b263b] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-3">
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
            © 2026 NexaChain Inc.
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: Auth Card, Segmented Switcher, and Mainnet Telemetry */}
      <div className="w-full lg:w-1/2 xl:w-7/12 lg:h-full flex flex-col justify-center items-center p-4 sm:p-6 lg:p-6 xl:p-8 z-10 bg-[#060a12]/90 lg:overflow-hidden">
        <div className="w-full max-w-md xl:max-w-lg mx-auto flex flex-col items-center justify-center my-auto py-2">
          {/* Main Card with Subtle Emerald Top Highlight */}
          <div className="w-full bg-[#0a101d]/95 border border-[#1b263b] border-t-emerald-500/30 rounded-2xl xl:rounded-3xl p-5 sm:p-6 xl:p-7 shadow-2xl shadow-black/80 relative">
            {/* Top Segmented Tab Switcher (Integrated inside card header) */}
            <div className="w-full grid grid-cols-2 p-1 bg-[#060b14] border border-[#1b263b] rounded-xl mb-4">
              <Link
                to="/login"
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isLogin
                    ? 'bg-[#121c2e] text-white border border-slate-700/70 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  !isLogin
                    ? 'bg-[#121c2e] text-white border border-slate-700/70 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </Link>
            </div>

            {/* Render Routed Component (LoginPage or RegisterPage) */}
            <Outlet />
          </div>

          {/* Bottom Telemetry Footer */}
          <div className="mt-3 xl:mt-4 flex items-center justify-between w-full px-1 text-[11px] font-mono text-slate-500 select-none">
            <div className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Mainnet Node 04 Synced (12ms)</span>
            </div>
            <div className="flex items-center gap-3">
              <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-slate-400 transition-colors">
                Terms of Service
              </a>
              <span>•</span>
              <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-slate-400 transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;