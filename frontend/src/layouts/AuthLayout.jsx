import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Layers } from 'lucide-react';

/**
 * AuthLayout Component
 * Standard layout for authentication pages (Login, Register).
 */
export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <Link to="/login" className="flex items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Layers className="w-7 h-7" />
            </div>
          </Link>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
            NexaChain Platform
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Investment & Multi-Tier Referral Management
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
