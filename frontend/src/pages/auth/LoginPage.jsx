import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, RefreshCw, ArrowRight } from 'lucide-react';
import { useLoginMutation } from '../../features/auth/authApi';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * LoginPage Component
 * 
 * Implements the Stitch institutional fintech login specification:
 * - High-contrast title and Protocol Tier 1 indicator
 * - Dark input surfaces with subtle borders, left iconography, and focus rings
 * - Session remembrance option
 * - Vibrant solid emerald submission button
 * - Seamless redirection and error feedback
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
    <div className="space-y-6">
      {/* Title & Protocol Badge Row */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sign In
          </h2>
          <span className="text-xs font-mono text-slate-400 border border-slate-700/80 px-2.5 py-1 rounded-lg bg-[#070b14]/60 select-none">
            Protocol Tier 1
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
          Sign in to access your NexaChain portfolio, automated daily compounding yields, and referral hierarchy telemetry.
        </p>
      </div>

      {/* Backend API Error Banner */}
      <ErrorMessage
        title="Authentication Failed"
        message={apiError?.message}
        errors={apiError?.errors}
      />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email Address */}
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="block text-xs font-medium text-slate-300">
            Corporate / Personal Email <span className="text-emerald-400">*</span>
          </label>
          <div
            className={`relative flex items-center rounded-xl bg-[#070b14] border transition-all ${
              formErrors.email
                ? 'border-rose-500/80 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500'
                : 'border-[#1d273c] focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500'
            }`}
          >
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
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
              className="w-full pl-10 pr-4 py-3 bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none"
            />
          </div>
          {formErrors.email && (
            <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
              <span>•</span> {formErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="login-password" className="block text-xs font-medium text-slate-300">
            Password <span className="text-emerald-400">*</span>
          </label>
          <div
            className={`relative flex items-center rounded-xl bg-[#070b14] border transition-all ${
              formErrors.password
                ? 'border-rose-500/80 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500'
                : 'border-[#1d273c] focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500'
            }`}
          >
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
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
              className="w-full pl-10 pr-10 py-3 bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {formErrors.password && (
            <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
              <span>•</span> {formErrors.password}
            </p>
          )}
        </div>

        {/* Remember Session Row */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberSession}
              onChange={(e) => setRememberSession(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-[#070b14] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer accent-emerald-500"
            />
            <span className="text-xs text-slate-400 hover:text-slate-300 transition-colors">
              Remember this workstation session
            </span>
          </label>
        </div>

        {/* Primary CTA Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1322]"
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

        {/* Alternate Navigation */}
        <div className="pt-2 text-center">
          <p className="text-xs sm:text-sm text-slate-400">
            Don't have an account yet?{' '}
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