import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { useLoginMutation } from '../../features/auth/authApi';
import { FormField } from '../../components/common/FormField';
import { AppButton } from '../../components/common/AppButton';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * LoginPage Component
 * Full-featured responsive login interface with client-side validation,
 * password show/hide toggle, loading feedback, and server error handling.
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
    // Clear error as user types
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

      // Redirect to the originally requested route or fallback to dashboard
      const redirectPath = location.state?.from?.pathname || '/dashboard';
      navigate(redirectPath, { replace: true });
    } catch (err) {
      // Error is caught and surfaced via apiError in the UI
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight">Sign In</h3>
        <p className="text-xs text-slate-400 mt-1">
          Access your NexaChain portfolio and daily earnings
        </p>
      </div>

      {/* Backend API Error Banner */}
      <ErrorMessage
        title="Authentication Failed"
        message={apiError?.message}
        errors={apiError?.errors}
      />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email Field */}
        <FormField
          id="login-email"
          label="Email Address"
          required
          error={formErrors.email}
        >
          <div className="relative">
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
              placeholder="you@example.com"
              className={`w-full pl-9 pr-3 py-2 bg-slate-950 border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                formErrors.email ? 'border-rose-500' : 'border-slate-800'
              }`}
            />
          </div>
        </FormField>

        {/* Password Field with Show/Hide Toggle */}
        <FormField
          id="login-password"
          label="Password"
          required
          error={formErrors.password}
        >
          <div className="relative">
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
              placeholder="••••••••"
              className={`w-full pl-9 pr-10 py-2 bg-slate-950 border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                formErrors.password ? 'border-rose-500' : 'border-slate-800'
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

        {/* Submit Button */}
        <AppButton
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="w-full mt-2 font-semibold"
        >
          <span>Sign In to NexaChain</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </AppButton>
      </form>

      {/* Switch to Registration */}
      <div className="text-center pt-3 border-t border-slate-800/80 text-xs text-slate-400">
        Don&apos;t have an account yet?{' '}
        <Link
          to="/register"
          className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors underline-offset-2 hover:underline"
        >
          Create an Account
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
