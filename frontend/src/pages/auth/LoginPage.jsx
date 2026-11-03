import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { useLoginMutation } from '../../features/auth/authApi';
import { FormField } from '../../components/common/FormField';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * LoginPage Component
 * 
 * High-end dark fintech login view matching the reference design:
 * - Clean fintech inputs with iconography
 * - Remember device & password recovery options
 * - Dynamic loading state and error handling
 * - Radiant emerald CTA button
 * - Seamless deep link to Create Account
 */
export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading, error: apiError }] = useLoginMutation();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(true);
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
      {/* Title & Description */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Sign In
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Access your NexaChain portfolio and automated daily yields
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
        <FormField
          id="login-email"
          label="Email Address"
          required
          error={formErrors.email}
        >
          <div className="relative">
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
              className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-950/90 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all ${
                formErrors.email
                  ? 'border-rose-500/80 focus:border-rose-500'
                  : 'border-slate-800 focus:border-emerald-500'
              }`}
            />
          </div>
        </FormField>

        {/* Password */}
        <FormField
          id="login-password"
          label="Password"
          required
          error={formErrors.password}
        >
          <div className="relative">
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
              className={`w-full pl-10 pr-10 py-2.5 bg-slate-950/90 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all ${
                formErrors.password
                  ? 'border-rose-500/80 focus:border-rose-500'
                  : 'border-slate-800 focus:border-emerald-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </FormField>

        {/* Remember Me & Recovery */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950 accent-emerald-500 cursor-pointer"
            />
            <span className="text-slate-300">Remember this session</span>
          </label>
          <span className="text-slate-500 hover:text-emerald-400 cursor-pointer transition-colors">
            Forgot password?
          </span>
        </div>

        {/* Primary CTA Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-3 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>Authenticating...</span>
            </span>
          ) : (
            <>
              <span>Sign In to NexaChain Portfolio</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="text-center pt-2 text-xs text-slate-400">
        Don&apos;t have an account yet?{' '}
        <Link
          to="/register"
          className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-0.5 underline-offset-2 hover:underline transition-colors ml-1"
        >
          <span>Create Account Instead</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
