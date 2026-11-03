import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Coins,
  User,
  LogOut,
  Layers,
  Wallet
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../app/store';
import { logout, selectCurrentUser } from '../features/auth/authSlice';

/**
 * AppLayout Component
 * Standard layout for authenticated dashboard views with navigation bar and user summary.
 */
export const AppLayout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/investments', label: 'Investments', icon: TrendingUp },
    { to: '/referrals', label: 'Referrals', icon: Users },
    { to: '/roi-history', label: 'ROI History', icon: Coins },
    { to: '/profile', label: 'Profile', icon: User }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <NavLink to="/dashboard" className="flex items-center gap-2.5 font-bold text-lg text-white">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <Layers className="w-5 h-5" />
              </div>
              <span className="tracking-tight">NexaChain</span>
            </NavLink>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-white border border-slate-700/60'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* User Profile & Wallet Balance */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">Balance:</span>
                <span className="font-semibold text-emerald-300">
                  ₹{((user.walletBalancePaise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                {user?.name || 'User'}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="sr-only">Log out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden border-t border-slate-800/80 px-4 py-2 flex items-center justify-around bg-slate-900/50">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 p-1 text-xs font-medium ${
                  isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-600">
        NexaChain Platform &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
};

export default AppLayout;
