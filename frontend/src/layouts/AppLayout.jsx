import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Share2,
  Coins,
  User,
  LogOut,
  Layers,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../app/store';
import { logout, selectCurrentUser } from '../features/auth/authSlice';
import { baseApi } from '../app/api/baseApi';

/**
 * AppLayout Component
 * 
 * High-end dark fintech application layout matching the reference dashboard design:
 * - Desktop Sidebar with vibrant emerald active state for Dashboard
 * - Balance widget with real-time wallet tracking
 * - Verified investor profile card with quick logout
 * - Header with dynamic route-aware breadcrumbs, Cron Engine status pill, and wallet overview
 * - Standardized footer bar
 */
export const AppLayout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector(selectCurrentUser);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    navigate('/login', { replace: true });
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/investments', label: 'Investments', icon: TrendingUp },
    { to: '/referrals', label: 'Referrals', icon: Share2 },
    { to: '/roi-history', label: 'ROI History', icon: Coins },
    { to: '/profile', label: 'Profile', icon: User },
    ...(user?.role === 'admin'
      ? [{ to: '/admin/investments', label: 'Admin Approvals', icon: ShieldCheck }]
      : [])
  ];

  const getBreadcrumbLabel = (pathname) => {
    if (pathname.startsWith('/investments/') && pathname !== '/investments') {
      return (
        <>
          <Link to="/investments" className="text-slate-400 hover:text-slate-200 transition-colors">
            Investments
          </Link>
          <span className="text-slate-600">&gt;</span>
          <span className="text-white font-semibold">Contract Details</span>
        </>
      );
    }
    switch (pathname) {
      case '/investments':
        return <span className="text-white font-semibold">Investments</span>;
      case '/referrals':
        return <span className="text-white font-semibold">Referrals</span>;
      case '/roi-history':
        return <span className="text-white font-semibold">ROI History</span>;
      case '/profile':
        return <span className="text-white font-semibold">Profile</span>;
      case '/admin/investments':
        return <span className="text-white font-semibold">Admin Approvals</span>;
      case '/dashboard':
      default:
        return <span className="text-white font-semibold">Dashboard</span>;
    }
  };

  const formattedBalance = user?.walletBalancePaise
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
      }).format(user.walletBalancePaise / 100)
    : '₹0.00';

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';
  const userName = user?.name || user?.email?.split('@')[0] || 'Investor';
  const userRole = user?.role === 'admin' ? 'Administrator' : 'Verified Investor';

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 2. Mobile Drawer Navigation */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#090d16] border-r border-slate-800/80 flex flex-col justify-between p-5 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div>
          {/* Brand header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800/80">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-950">
                <Layers className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="tracking-tight text-white font-extrabold text-base leading-none">NexaChain</span>
                <span className="text-[9px] text-emerald-400 font-semibold tracking-wider mt-0.5">CAPITAL & ROI</span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Mobile Sidebar Footer */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="p-3.5 bg-[#0b101b] rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">AVAILABLE BALANCE</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-lg font-extrabold text-white">
              {formattedBalance}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 3. Desktop Fixed Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-[#090d16] border-r border-slate-800/80 z-30">
        <div className="flex flex-col flex-1 min-h-0 justify-between">
          <div>
            {/* Brand Header */}
            <div className="flex items-center gap-3 px-6 h-18 py-5 border-b border-slate-800/80">
              <Link to="/dashboard" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
                  <Layers className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="flex flex-col">
                  <span className="tracking-tight text-white font-black text-base leading-none">NexaChain</span>
                  <span className="text-[9px] text-emerald-400 font-bold tracking-widest mt-0.5">CAPITAL & ROI</span>
                </div>
              </Link>
            </div>

            {/* Navigation Menu */}
            <div className="px-3.5 py-6 space-y-1.5">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>

          {/* Bottom Sidebar: Balance Widget and Verified User Card */}
          <div className="p-3.5 border-t border-slate-800/80 space-y-3">
            {/* Available Balance Card */}
            <div className="p-3.5 bg-[#0b101b] rounded-2xl border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  AVAILABLE BALANCE
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="mt-1">
                <div className="text-xl font-extrabold text-white tracking-tight">
                  {formattedBalance}
                </div>
              </div>
            </div>

            {/* User Card */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {userName}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-semibold truncate">
                    {userRole}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 4. Main Body Wrapper (Shifted right by 256px on desktop) */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 h-16 bg-[#070b13]/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 md:hidden"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Route-Aware Dynamic Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-slate-400">Platform</span>
              <span className="text-slate-600">&gt;</span>
              {getBreadcrumbLabel(location.pathname)}
            </div>
          </div>

          {/* Right Header Status Badges & Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Cron Engine Status Pill */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cron Engine: Active (Midnight IST)</span>
            </div>

            {/* Wallet Balance Pill */}
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-900 border border-slate-800 text-white">
              <span className="text-slate-400 mr-1.5 font-normal">WALLET</span>
              <span>{formattedBalance}</span>
            </div>

            {/* Profile Avatar */}
            <Link
              to="/profile"
              className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-800/80 text-emerald-400 flex items-center justify-center text-xs font-bold hover:scale-105 transition-transform"
              title="View Profile"
            >
              {userInitial}
            </Link>
          </div>
        </header>

        {/* Main Viewport Content */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
          <Outlet />
        </main>

        {/* Footer Bar */}
        <footer className="border-t border-slate-800/80 px-6 py-4 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
          <div>NexaChain Capital Platform &bull; Version 1.0.0</div>
          <div>Daily Midnight IST Cron Engine Verified &bull; 2026</div>
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;
