import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, Key, ArrowRight } from 'lucide-react';
import { useRegisterMutation } from '../../features/auth/authApi';
import { FormField } from '../../components/common/FormField';
import { AppButton } from '../../components/common/AppButton';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)/;

/**
 * RegisterPage Component
 * Full-featured responsive registration interface with client-side validation,
 * password matching, password visibility toggles, loading feedback, and server error handling.
 */
export const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [registerUser, { isLoading, error: apiError }] = useRegisterMutation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: searchParams.get('ref') || searchParams.get('referralCode') || ''
  });

  // Keep referral code updated if query param arrives after initial render
  useEffect(() => {
    const refFromUrl = searchParams.get('ref') || searchParams.get('referralCode');
    if (refFromUrl && !formData.referralCode) {
      setFormData((prev) => ({ ...prev, referralCode: refFromUrl.trim().toUpperCase() }));
    }
  }, [searchParams]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for field as user corrects input
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedRef = formData.referralCode.trim();

    // 1. Name validation
    if (!trimmedName) {
      errors.name = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters long.';
    } else if (trimmedName.length > 100) {
      errors.name = 'Name cannot exceed 100 characters.';
    }

    // 2. Email validation
    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Please provide a valid email address.';
    }

    // 3. Password validation (matches backend regex)
    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    } else if (!PASSWORD_REGEX.test(formData.password)) {
      errors.password = 'Password must contain at least one letter and at least one number.';
    }

    // 4. Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required.';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    // 5. Referral code validation (optional)
    if (trimmedRef && trimmedRef.length < 3) {
      errors.referralCode = 'Referral code must be at least 3 characters long.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare strictly compliant payload for backend contract
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password
    };

    if (formData.referralCode.trim()) {
      payload.referralCode = formData.referralCode.trim().toUpperCase();
    }

    try {
      await registerUser(payload).unwrap();
      // On success, credentials are set in Redux and user is redirected to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // Backend error surfaced via apiError in the UI
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight">Create Account</h3>
        <p className="text-xs text-slate-400 mt-1">
          Join NexaChain to start earning daily ROI and referral rewards
        </p>
      </div>

      {/* Backend API Error Banner */}
      <ErrorMessage
        title="Registration Failed"
        message={apiError?.message}
        errors={apiError?.errors}
      />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Full Name */}
        <FormField
          id="register-name"
          label="Full Name"
          required
          error={formErrors.name}
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <User className="w-4 h-4" />
            </div>
            <input
              id="register-name"
              name="name"
              type="text"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Alex Johnson"
              className={`w-full pl-9 pr-3 py-2 bg-slate-950 border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                formErrors.name ? 'border-rose-500' : 'border-slate-800'
              }`}
            />
          </div>
        </FormField>

        {/* Email Address */}
        <FormField
          id="register-email"
          label="Email Address"
          required
          error={formErrors.email}
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="register-email"
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

        {/* Password */}
        <FormField
          id="register-password"
          label="Password"
          required
          error={formErrors.password}
          hint="Minimum 8 characters with at least one letter and one number"
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
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

        {/* Confirm Password */}
        <FormField
          id="register-confirm-password"
          label="Confirm Password"
          required
          error={formErrors.confirmPassword}
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full pl-9 pr-10 py-2 bg-slate-950 border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                formErrors.confirmPassword ? 'border-rose-500' : 'border-slate-800'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </FormField>

        {/* Optional Referral Code */}
        <FormField
          id="register-referral-code"
          label="Referral Code (Optional)"
          error={formErrors.referralCode}
          hint="If invited by a sponsor, enter their 8-character referral code"
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Key className="w-4 h-4" />
            </div>
            <input
              id="register-referral-code"
              name="referralCode"
              type="text"
              value={formData.referralCode}
              onChange={handleChange}
              placeholder="e.g. A1B2C3D4"
              className={`w-full pl-9 pr-3 py-2 bg-slate-950 border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase tracking-wider font-mono transition-all ${
                formErrors.referralCode ? 'border-rose-500' : 'border-slate-800'
              }`}
            />
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
          <span>Complete Registration</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </AppButton>
      </form>

      {/* Switch to Login */}
      <div className="text-center pt-3 border-t border-slate-800/80 text-xs text-slate-400">
        Already have a NexaChain account?{' '}
        <Link
          to="/login"
          className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors underline-offset-2 hover:underline"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
