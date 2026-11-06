import React, { useState, useEffect, useRef } from 'react';
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
  ShieldCheck,
  Bell,
  ChevronRight
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../app/store';
import { logout, selectCurrentUser } from '../features/auth/authSlice';
import { baseApi } from '../app/api/baseApi';
import { formatPaiseToINR } from '../utils/formatters';

/**
 * AppLayout Component
 * 
 * Institutional fintech application shell with consistent visual hierarchy:
 * - Desktop Sidebar (`surface-sidebar`) with clean grouped navigation and compact user identity.
 * - Responsive Mobile Drawer with backdrop, Escape-key dismiss, and body scroll lock.
 * - Top Header (`surface-canvas` with blur) with route breadcrumbs, honest notification popover,
 *   and verified wallet balance.
 * - Main viewport (`max-w-7xl`) with standardized padding and typography tokens.
 */
export const AppLayout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector(selectCurrentUser);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef(null);
  const triggerButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const prevMobileMenuOpenRef = useRef(false);

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationOpen(false);
  }, [location.pathname]);

  // Manage drawer focus transitions
  useEffect(() => {
    if (mobileMenuOpen) {
      // Focus enters drawer
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    } else if (prevMobileMenuOpenRef.current) {
      // Focus returns to the trigger button when drawer is closed
      triggerButtonRef.current?.focus();
    }
    prevMobileMenuOpenRef.current = mobileMenuOpen;
  }, [mobileMenuOpen]);

  // Handle escape key, click outside, and focus trapping inside mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (mobileMenuOpen) setMobileMenuOpen(false);
        if (notificationOpen) setNotificationOpen(false);
      }

      // Trap focus in drawer when open
      if (mobileMenuOpen && e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotificationOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen, notificationOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    navigate('/login', { replace: true });
  };

  // Logically grouped navigation hierarchy
  const navigationGroups = [
    {
      title: 'Portfolio',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/investments', label: 'Investments', icon: TrendingUp },
        { to: '/roi-history', label: 'ROI History', icon: Coins }
      ]
    },
    {
      title: 'Affiliates',
      items: [
        { to: '/referrals', label: 'Referrals', icon: Share2 }
      ]
    },
    ...(user?.role === 'admin'
      ? [
          {
            title: 'Administration',
            items: [
              { to: '/admin/investments', label: 'Admin Approvals', icon: ShieldCheck }
            ]
          }
        ]
      : []),
    {
      title: 'Preferences',
      items: [
        { to: '/profile', label: 'Profile', icon: User }
      ]
    }
  ];

  const getBreadcrumbLabel = (pathname) => {
    if (pathname.startsWith('/investments/') && pathname !== '/investments') {
      return (
        <div className="flex items-center gap-1.5 text-xs">
          <Link to="/investments" className="text-text-secondary hover:text-text-primary transition-colors">
            Investments
          </Link>
          <ChevronRight className="w-3 h-3 text-text-muted" aria-hidden="true" />
          <span className="text-text-primary font-medium">Contract Details</span>
        </div>
      );
    }
    switch (pathname) {
      case '/investments':
        return <span className="text-text-primary font-medium">Investments</span>;
      case '/referrals':
        return <span className="text-text-primary font-medium">Referrals</span>;
      case '/roi-history':
        return <span className="text-text-primary font-medium">ROI History</span>;
      case '/profile':
        return <span className="text-text-primary font-medium">Profile</span>;
      case '/admin/investments':
        return <span className="text-text-primary font-medium">Admin Approvals</span>;
      case '/dashboard':
      default:
        return <span className="text-text-primary font-medium">Dashboard</span>;
    }
  };

  const formattedBalance = user?.walletBalancePaise !== undefined
    ? formatPaiseToINR(user.walletBalancePaise)
    : '₹0.00';

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';
  const userName = user?.name || user?.email?.split('@')[0] || 'Investor';
  const userRole = user?.role === 'admin' ? 'Administrator' : 'Investor';

  const navLinkClass = ({ isActive }) =>
    `group flex items-center gap-3 px-3 py-2 rounded-button text-xs sm:text-sm font-medium transition-colors select-none ${
      isActive
        ? 'bg-surface-elevated text-text-primary border border-border-subtle shadow-none'
        : 'text-text-secondary hover:text-text-primary hover:bg-surface-card-hover border border-transparent'
    }`;

  return (
    <div className="min-h-screen bg-surface-canvas text-text-primary flex font-sans selection:bg-semantic-positive/20 selection:text-text-primary">
      {/* 1. Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 2. Mobile Drawer Navigation */}
      <div
        ref={drawerRef}
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-surface-sidebar border-r border-border-subtle flex flex-col justify-between p-5 transform transition-all duration-200 ease-out md:hidden ${
          mobileMenuOpen
            ? 'translate-x-0 opacity-100 visible'
            : '-translate-x-full opacity-0 invisible pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        <div className="space-y-6">
          {/* Brand header */}
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus rounded-button"
            >
              <div className="w-8 h-8 rounded-button bg-surface-elevated border border-border-strong flex items-center justify-center text-semantic-positive">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="tracking-tight text-text-primary font-bold text-sm leading-none">NexaChain</span>
                <span className="text-[9px] text-text-muted font-medium tracking-wider mt-0.5 uppercase">Capital Platform</span>
              </div>
            </Link>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-card-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grouped Navigation Links */}
          <nav className="space-y-5">
            {navigationGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <span className="px-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                  {group.title}
                </span>
                {group.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={navLinkClass}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-text-muted group-hover:text-text-secondary" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </div>

        {/* Mobile User Identity Footer */}
        <div className="pt-4 border-t border-border-subtle">
          <div className="flex items-center justify-between p-2 rounded-card bg-surface-card border border-border-subtle">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center text-xs font-semibold text-text-primary shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate leading-tight">
                  {userName}
                </p>
                <p className="text-[10px] text-text-muted truncate mt-0.5">
                  {userRole}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-button text-text-muted hover:text-semantic-danger hover:bg-surface-card-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Desktop Fixed Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-surface-sidebar border-r border-border-subtle z-30">
        <div className="flex flex-col flex-1 min-h-0 justify-between">
          <div className="flex-1 overflow-y-auto">
            {/* Brand Header */}
            <div className="flex items-center gap-2.5 px-6 h-16 border-b border-border-subtle">
              <Link
                to="/dashboard"
                className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus rounded-button"
              >
                <div className="w-8 h-8 rounded-button bg-surface-elevated border border-border-strong flex items-center justify-center text-semantic-positive">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="tracking-tight text-text-primary font-bold text-sm leading-none">NexaChain</span>
                  <span className="text-[9px] text-text-muted font-medium tracking-wider mt-0.5 uppercase">Capital Platform</span>
                </div>
              </Link>
            </div>

            {/* Navigation Groups */}
            <nav className="p-3.5 space-y-5">
              {navigationGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <span className="px-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-1.5 select-none">
                    {group.title}
                  </span>
                  {group.items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={navLinkClass}
                    >
                      <Icon className="w-4 h-4 shrink-0 text-text-muted group-hover:text-text-secondary" />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>
          </div>

          {/* Bottom Sidebar: Compact User Identity Card (Replaced duplicate balance widget) */}
          <div className="p-3.5 border-t border-border-subtle">
            <div className="flex items-center justify-between p-2 rounded-card bg-surface-card border border-border-subtle">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center text-xs font-semibold text-text-primary shrink-0">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate leading-tight">
                    {userName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {user?.role === 'admin' ? (
                      <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.2 rounded bg-semantic-pending/10 text-semantic-pending border border-semantic-pending/30">
                        Admin
                      </span>
                    ) : (
                      <span className="text-[10px] text-text-muted truncate">
                        Investor
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
                className="p-1.5 rounded-button text-text-muted hover:text-semantic-danger hover:bg-surface-card-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus"
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
        <header className="sticky top-0 z-20 h-16 bg-surface-canvas/90 backdrop-blur-md border-b border-border-subtle flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle button */}
            <button
              ref={triggerButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-button text-text-secondary hover:text-text-primary hover:bg-surface-card-hover md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Route-Aware Dynamic Breadcrumbs */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium text-text-secondary min-w-0">
              <span className="hidden sm:inline text-text-muted select-none">Platform</span>
              <ChevronRight className="hidden sm:inline w-3 h-3 text-text-muted select-none shrink-0" aria-hidden="true" />
              <div className="truncate">{getBreadcrumbLabel(location.pathname)}</div>
            </div>
          </div>

          {/* Right Header Status Badges & Controls */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Wallet Balance Display Pill */}
            <div className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-xs font-sans font-medium bg-surface-card border border-border-subtle text-text-primary">
              <span className="text-text-muted text-[11px] hidden xs:inline">Wallet:</span>
              <span className="font-tabular tabular-nums font-semibold">{formattedBalance}</span>
            </div>

            {/* Notification Bell with Honest Transparent Popover */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setNotificationOpen((prev) => !prev)}
                className="w-8 h-8 rounded-full bg-surface-card hover:bg-surface-elevated border border-border-subtle text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus"
                aria-label="View notifications"
                aria-expanded={notificationOpen}
              >
                <Bell className="w-4 h-4" />
              </button>

              {notificationOpen && (
                <div
                  role="dialog"
                  aria-label="Notifications"
                  className="absolute right-0 mt-2 w-80 bg-surface-card border border-border-subtle rounded-card shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-border-subtle">
                    <span className="text-xs font-semibold text-text-primary">Notifications</span>
                    <span className="text-[10px] text-text-muted">0 unread</span>
                  </div>
                  <div className="py-4 text-center space-y-1">
                    <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border-subtle text-text-muted flex items-center justify-center mx-auto mb-2">
                      <Bell className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-medium text-text-primary">No Notifications</p>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      In-app alerts are not currently active. Live settlement records and investment status updates are tracked directly on your dashboard and ledger history.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar Link */}
            <Link
              to="/profile"
              className="w-8 h-8 rounded-full bg-surface-elevated border border-border-strong text-text-primary flex items-center justify-center text-xs font-semibold hover:border-text-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus"
              title="View Profile"
              aria-label="User Profile"
            >
              {userInitial}
            </Link>
          </div>
        </header>

        {/* Main Viewport Content */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
          <Outlet />
        </main>

        {/* Institutional Footer */}
        <footer className="border-t border-border-subtle px-6 py-4 text-xs text-text-muted flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
          <div>NexaChain Capital Platform &bull; Version 1.0.0</div>
          <div>Integer-Paise Verified Ledger &bull; 2026</div>
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;
