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
 * - Standardized primary CTA button
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
    <div className="space-y-5">
      {/* Title & Description */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          Sign In
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
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
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
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
              className={`w-full pl-10 pr-3.5 py-2.5 bg-surface-canvas border rounded-button text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-semantic-focus transition-all ${
                formErrors.email
                  ? 'border-semantic-danger focus:border-semantic-danger'
                  : 'border-border-subtle focus:border-border-strong'
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
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
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
              className={`w-full pl-10 pr-10 py-2.5 bg-surface-canvas border rounded-button text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-semantic-focus transition-all ${
                formErrors.password
                  ? 'border-semantic-danger focus:border-semantic-danger'
                  : 'border-border-subtle focus:border-border-strong'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-secondary transition-colors focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </FormField>

        {/* Primary CTA Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-3 py-3 px-5 rounded-button bg-brand-primary hover:bg-brand-hover active:bg-emerald-700 text-brand-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface-canvas"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-brand-primary-foreground" />
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
      <div className="text-center pt-2 text-xs text-text-secondary">
        Don&apos;t have an account yet?{' '}
        <Link
          to="/register"
          className="text-brand-primary hover:text-brand-hover hover:underline font-semibold inline-flex items-center gap-0.5 underline-offset-2 transition-colors ml-1"
        >
          <span>Create Account Instead</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
