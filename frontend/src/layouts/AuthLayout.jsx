import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Layers,
  Share2,
  Zap,
  Lock,
  CheckCircle2,
  LogIn,
  UserPlus
} from 'lucide-react';

/**
 * AuthLayout Component
 * 
 * Restrained institutional fintech authentication layout:
 * - Clean application canvas (`surface-canvas`) with zero decorative ambient blur orbs.
 * - Non-shifting split layout between brand showcase and form container.
 * - Standardized semantic tokens for surfaces, typography, borders, and segmented tab switcher.
 */
export const AuthLayout = () => {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div className="min-h-screen lg:h-screen bg-surface-canvas text-text-primary flex flex-col lg:flex-row font-sans selection:bg-semantic-positive/20 selection:text-text-primary relative overflow-x-hidden lg:overflow-hidden">
      {/* LEFT COLUMN: Fixed Viewport Height, Non-Scrolling Brand Showcase */}
      <div className="w-full lg:w-1/2 xl:w-5/12 lg:h-full flex flex-col justify-between p-6 sm:p-8 lg:p-8 xl:p-10 border-b lg:border-b-0 lg:border-r border-border-subtle bg-surface-sidebar z-10 select-none overflow-hidden">
        {/* Top Header Row: Logo */}
        <div className="flex items-center justify-between gap-4 shrink-0">
          <Link
            to="/login"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus rounded-button"
          >
            <div className="w-8 h-8 rounded-button bg-surface-elevated border border-border-strong flex items-center justify-center text-semantic-positive">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-text-primary block leading-none">
                NexaChain
              </span>
              <span className="text-[9px] uppercase font-mono tracking-wider text-text-muted font-medium block mt-0.5">
                Capital Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Middle Hero Showcase: Headline, Description, and Tier Matrix */}
        <div className="my-auto py-4 space-y-4 max-w-xl shrink-0">
          {/* Section Tag */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-elevated border border-border-subtle text-text-secondary text-[10px] font-semibold tracking-wider uppercase">
            <Share2 className="w-3 h-3 text-semantic-positive" />
            <span>Multi-Level Affiliate Network</span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-text-primary tracking-tight leading-[1.2]">
            Automated Daily{' '}
            <span className="block">ROI & Multi-Tier</span>
            <span className="text-semantic-positive">
              Affiliate Network.
            </span>
          </h1>

          {/* Description */}
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-lg">
            Monitor investment packages with automated daily compounding yields and inspect multi-generational affiliate networks with integer precision.
          </p>

          {/* Multi-Tier Affiliate Hierarchy Card */}
          <div className="bg-surface-card border border-border-subtle rounded-card p-4 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="uppercase font-semibold tracking-wider text-text-muted text-[10px]">
                Multi-Tier Affiliate Hierarchy
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-semantic-positive/10 border border-semantic-positive/30 text-semantic-positive text-[10px] font-medium">
                <Zap className="w-3 h-3" />
                Audited Calculations
              </span>
            </div>

            {/* Matrix Rows */}
            <div className="space-y-1.5 font-sans">
              {/* Tier 1 */}
              <div className="flex items-center justify-between p-2.5 rounded-button bg-surface-canvas border border-border-subtle hover:border-border-strong transition-colors">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-semantic-positive/15 text-semantic-positive border border-semantic-positive/30">
                    Tier 1
                  </span>
                  <span className="text-xs font-medium text-text-primary">
                    Direct Sponsor Downline
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-semantic-positive">
                  Level 1 Direct
                </span>
              </div>

              {/* Tier 2 */}
              <div className="flex items-center justify-between p-2.5 rounded-button bg-surface-canvas border border-border-subtle hover:border-border-strong transition-colors">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-surface-elevated text-text-secondary border border-border-subtle">
                    Tier 2
                  </span>
                  <span className="text-xs font-medium text-text-secondary">
                    Secondary Network
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-text-secondary">
                  Level 2 Network
                </span>
              </div>

              {/* Tier 3-5 */}
              <div className="flex items-center justify-between p-2.5 rounded-button bg-surface-canvas border border-border-subtle hover:border-border-strong transition-colors">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-surface-elevated text-text-muted border border-border-subtle">
                    Tier 3-5
                  </span>
                  <span className="text-xs font-medium text-text-muted">
                    Generational Downline
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-text-muted">
                  Levels 3 to 5
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Indicators */}
        <div className="pt-3 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted shrink-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-text-secondary text-[11px]">
              <Lock className="w-3.5 h-3.5 text-semantic-positive" />
              Integer Paise Precision
            </span>
            <span className="text-border-strong">•</span>
            <span className="inline-flex items-center gap-1.5 text-text-secondary text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-semantic-positive" />
              Audited Daily Settlements
            </span>
          </div>
          <span className="text-text-muted font-mono text-[10px]">
            © 2026 NexaChain
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: Consistent Top-Aligned Auth Card Container */}
      <div className="w-full lg:w-1/2 xl:w-7/12 lg:h-full flex flex-col justify-start items-center p-4 sm:p-6 lg:p-8 pt-6 sm:pt-8 lg:pt-10 xl:pt-12 z-10 lg:overflow-y-auto">
        <div className="w-full max-w-xl space-y-4 pb-6">
          {/* Main Card with Restrained Border and Surface */}
          <div className="bg-surface-card border border-border-subtle rounded-card p-5 sm:p-7 lg:p-8 shadow-sm relative">
            {/* Top Segmented Tab Switcher */}
            <div className="grid grid-cols-2 p-1 bg-surface-canvas border border-border-subtle rounded-button mb-6">
              <Link
                to="/login"
                className={`py-2 px-4 rounded-button text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus ${
                  isLogin
                    ? 'bg-surface-elevated text-text-primary border border-border-subtle shadow-none'
                    : 'text-text-secondary hover:text-text-primary border border-transparent'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className={`py-2 px-4 rounded-button text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus ${
                  !isLogin
                    ? 'bg-surface-elevated text-text-primary border border-border-subtle shadow-none'
                    : 'text-text-secondary hover:text-text-primary border border-transparent'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </Link>
            </div>

            {/* Render Routed Component (LoginPage or RegisterPage) */}
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
