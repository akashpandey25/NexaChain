import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Coins,
  User,
  LogOut,
  Layers,
  Wallet,
  Menu,
  X,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../app/store';
import { logout, selectCurrentUser } from '../features/auth/authSlice';
import { baseApi } from '../app/api/baseApi';

/**
 * AppLayout Component
 * 
 * Responsive application shell with desktop sidebar, mobile drawer,
 * sticky top bar with page title, user profile, and resetApiState logout.
 */
export const AppLayout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector(selectCurrentUser);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    // 1. Clear credentials in Redux and localStorage
    dispatch(logout());
    // 2. Clear all cached RTK Query state to avoid data leakage between users
    dispatch(baseApi.util.resetApiState());
    // 3. Redirect to login
    navigate('/login', { replace: true });
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/investments', label: 'Investments', icon: TrendingUp },
    { to: '/referrals', label: 'Referrals', icon: Users },
    { to: '/roi-history', label: 'ROI History', icon: Coins },
    { to: '/profile', label: 'Profile', icon: User }
  ];

  // Resolve current page title dynamically from route
  const getPageTitle = (pathname) => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname.startsWith('/investments/')) return 'Investment Details';
    if (pathname === '/investments') return 'Investments';
    if (pathname === '/referrals') return 'Referral Network';
    if (pathname === '/roi-history') return 'Daily ROI History';
    if (pathname === '/profile') return 'Account Profile';
    return 'Dashboard';
  };

  const formattedBalance = user?.walletBalancePaise
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
      }).format(user.walletBalancePaise / 100)
    : '₹0.00';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* 1. Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 2. Mobile Drawer Navigation */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-5 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        <div>
          {/* Brand header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <NavLink
              to="/dashboard"
              className="flex items-center gap-2.5 font-bold text-lg text-white"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-950">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="tracking-tight text-white font-bold leading-none">NexaChain</span>
                <span className="text-[10px] text-emerald-400 font-medium tracking-wide mt-0.5">FINANCIAL PLATFORM</span>
              </div>
            </NavLink>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-50" />
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Mobile Sidebar Footer */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Wallet Balance</span>
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-base font-bold text-emerald-400">
              {formattedBalance}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg border border-transparent hover:border-rose-900/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 3. Desktop Fixed Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-slate-900/95 border-r border-slate-800 z-30">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand header */}
          <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
            <NavLink to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-950">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="tracking-tight text-white font-bold text-base leading-none">NexaChain</span>
                <span className="text-[9px] text-emerald-400 font-semibold tracking-wider mt-0.5">CAPITAL & ROI</span>
              </div>
            </NavLink>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Menu
            </div>
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-medium'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>

          {/* Desktop Sidebar Bottom User Card */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/90 mb-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="text-[11px] font-medium text-slate-400">Available Balance</span>
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-base font-bold text-emerald-400">
                {formattedBalance}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate leading-tight">
                    {user?.name || 'Investor'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {user?.role ? user.role.toUpperCase() : 'USER'}
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

      {/* 4. Main Body Wrapper (Shifted right on desktop by w-64) */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-20 h-16 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 md:hidden"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Dynamic Page Title */}
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {getPageTitle(location.pathname)}
              </h1>
            </div>
          </div>

          {/* Top Right Info & Quick Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Wallet Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">Balance:</span>
              <span className="font-semibold text-emerald-400">{formattedBalance}</span>
            </div>

            {/* Top Bar User Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-800/80 text-emerald-300 flex items-center justify-center text-xs font-bold">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden sm:inline text-xs font-medium text-slate-300">
                {user?.name || 'Account'}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 ml-2 px-2.5 py-1 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors border border-transparent hover:border-slate-800"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-600">
          NexaChain Investment & Multi-Tier Referral Platform &copy; 2026. Secure Integer Paise Engine.
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;
