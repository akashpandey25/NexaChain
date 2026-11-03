import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Layers, ShieldCheck } from 'lucide-react';

/**
 * AuthLayout Component
 * Clean, modern fintech authentication layout with restrained green accents
 * and high-contrast typography.
 */
export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <Link to="/login" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-2xl p-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-950 transition-transform group-hover:scale-105">
              <Layers className="w-6 h-6" />
            </div>
          </Link>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
            NexaChain Platform
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Secure Automated Investment & Multi-Tier Referrals
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <Outlet />
        </div>

        {/* Trust & Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500/80" />
          <span>256-Bit Encrypted & JWT Verified Session</span>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
