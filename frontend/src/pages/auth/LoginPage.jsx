import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLoginMutation } from '../../features/auth/authApi';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * LoginPage Component
 * 
 * Recreates the Stitch Enterprise Login specification:
 * - Clean vertical rhythm that prevents scrolling on desktop viewports
 * - High-contrast inputs with left iconography
 * - Password row with direct "Forgot password?" action
 * - Session preservation checkbox & 2FA Protected badge
 * - Solid emerald primary action button
 * - Enterprise Access divider with Hardware Security Key (FIDO2) fallback
 * - Retains all backend validation and authentication contracts
 */
export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading, error: apiError }] = useLoginMutation();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [rememberSession, setRememberSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      }).unwrap();

      const redirectPath = location.state?.from?.pathname || '/dashboard';
      navigate(redirectPath, { replace: true });
    } catch (err) {
      // Backend error is surfaced via apiError
    }
  };

  return (
    <div className="space-y-3.5 xl:space-y-4">
      {/* Title & Description */}
      <div>
        <h2 className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-white tracking-tight">
          Sign In
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-snug">
          Access your NexaChain portfolio, yield ledger, and affiliate network.
        </p>
      </div>

      {/* Backend API Error Banner */}
      <ErrorMessage
        title="Authentication Failed"
        message={apiError?.message}
        errors={apiError?.errors}
      />

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        {/* Email Address */}
        <div className="space-y-1">
          <label htmlFor="login-email" className="block text-xs font-medium text-slate-300">
            Email Address <span className="text-emerald-400">*</span>
          </label>
          <div
            className={`relative flex items-center rounded-xl bg-[#060b14] border transition-all ${
              formErrors.email
                ? 'border-rose-500/80 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500'
                : 'border-[#1d273c] focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500'
            }`}
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="alex@nexachain.io"
              className="w-full pl-9 pr-3 py-2.5 bg-transparent text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none"
            />
          </div>
          {formErrors.email && (
            <p className="text-[11px] text-rose-400 mt-0.5 flex items-center gap-1">
              <span>•</span> {formErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="block text-xs font-medium text-slate-300">
              Password <span className="text-emerald-400">*</span>
            </label>
            <a
              href="#forgot-password"
              onClick={(e) => e.preventDefault()}
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              Forgot password?
            </a>
          </div>
          <div
            className={`relative flex items-center rounded-xl bg-[#060b14] border transition-all ${
              formErrors.password
                ? 'border-rose-500/80 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500'
                : 'border-[#1d273c] focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500'
            }`}
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••••••"
              className="w-full pl-9 pr-9 py-2.5 bg-transparent text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {formErrors.password && (
            <p className="text-[11px] text-rose-400 mt-0.5 flex items-center gap-1">
              <span>•</span> {formErrors.password}
            </p>
          )}
        </div>

        {/* Remember Session & 2FA Row */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberSession}
              onChange={(e) => setRememberSession(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-700 bg-[#060b14] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer accent-emerald-500"
            />
            <span className="text-xs text-slate-400 hover:text-slate-300 transition-colors">
              Remember for 30 days
            </span>
          </label>
          <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-full bg-[#060b14] border border-[#1b263b] flex items-center gap-1 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            2FA Protected
          </span>
        </div>

        {/* Primary CTA Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-1.5 py-2.5 xl:py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a101d]"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>Authenticating...</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span>Sign In to NexaChain Portfolio</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </button>

        {/* Enterprise Access Divider */}
        <div className="relative flex items-center justify-center pt-2 pb-1 select-none">
          <div className="w-full border-t border-[#1b263b]"></div>
          <span className="absolute bg-[#0a101d] px-2.5 text-[9px] font-mono uppercase tracking-widest text-slate-500">
            Enterprise Access
          </span>
        </div>

        {/* Hardware Security Key (FIDO2) Secondary Option */}
        <button
          type="button"
          onClick={() => {}}
          className="w-full py-2 px-3 rounded-xl bg-[#060b14] border border-[#1d273c] hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors select-none"
        >
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Continue with Hardware Security Key (FIDO2)</span>
        </button>

        {/* Alternate Navigation */}
        <div className="pt-1 text-center">
          <p className="text-xs text-slate-400">
            Don't have an institutional account yet?{' '}
            <Link
              to="/register"
              className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <span>Create Account Instead</span>
              <span>↗</span>
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;