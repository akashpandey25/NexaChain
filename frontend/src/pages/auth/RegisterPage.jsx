import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Lock,
  Key,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { useRegisterMutation } from '../../features/auth/authApi';
import { FormField } from '../../components/common/FormField';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)/;
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

/**
 * RegisterPage Component
 * 
 * Recreates the exact multi-column design from the specification screenshot:
 * - 2-column input grid for Name & Email
 * - Standardized Indian Mobile Number input with +91 country code badge
 * - 2-column input grid for Password & Confirm Password
 * - Dynamic password strength meter bar & helper text
 * - Green checkmark badge on password match
 * - Monospace referral code input with "Sponsor Verified" pill
 * - Protocol Terms, Yield Risk Disclosure & Privacy Policy agreement checkbox
 * - Radiant emerald CTA button
 */
export const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [registerUser, { isLoading, error: apiError }] = useRegisterMutation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    referralCode: searchParams.get('ref') || searchParams.get('referralCode') || ''
  });

  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Sync referral code if query param arrives or updates
  useEffect(() => {
    const refFromUrl = searchParams.get('ref') || searchParams.get('referralCode');
    if (refFromUrl && !formData.referralCode) {
      setFormData((prev) => ({ ...prev, referralCode: refFromUrl.trim().toUpperCase() }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;
    if (name === 'mobileNumber') {
      // Extract digits only, maximum 10 digits
      sanitizedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Live password strength computation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', width: '0%', color: 'bg-slate-700', text: 'text-slate-500' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', width: '25%', color: 'bg-rose-500', text: 'text-rose-400' };
    if (score === 2) return { score: 2, label: 'Fair', width: '50%', color: 'bg-amber-500', text: 'text-amber-400' };
    if (score === 3) return { score: 3, label: 'Good', width: '75%', color: 'bg-teal-400', text: 'text-teal-400' };
    return { score: 4, label: 'Strong Password', width: '100%', color: 'bg-emerald-400', text: 'text-emerald-400' };
  };

  const strength = getPasswordStrength(formData.password);
  const isPasswordMatch =
    Boolean(formData.password) &&
    Boolean(formData.confirmPassword) &&
    formData.password === formData.confirmPassword;

  const isReferralValid = formData.referralCode.trim().length >= 3;

  const validateForm = () => {
    const errors = {};
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedMobile = formData.mobileNumber.trim();
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

    // 3. Mobile number validation (10-digit Indian mobile number)
    if (!trimmedMobile) {
      errors.mobileNumber = 'Mobile number is required.';
    } else if (!INDIAN_MOBILE_REGEX.test(trimmedMobile)) {
      errors.mobileNumber = 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
    }

    // 4. Password validation
    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    } else if (!PASSWORD_REGEX.test(formData.password)) {
      errors.password = 'Password must contain at least 1 letter and 1 number.';
    }

    // 5. Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required.';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    // 6. Referral code validation (optional)
    if (trimmedRef && trimmedRef.length < 3) {
      errors.referralCode = 'Referral code must be at least 3 characters long.';
    }

    // 7. Terms agreement
    if (!agreeTerms) {
      errors.terms = 'You must agree to the NexaChain Protocol Terms.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      mobileNumber: `+91${formData.mobileNumber.trim()}`,
      password: formData.password
    };

    if (formData.referralCode.trim()) {
      payload.referralCode = formData.referralCode.trim().toUpperCase();
    }

    try {
      await registerUser(payload).unwrap();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // Backend error is surfaced via apiError
    }
  };

  return (
    <div className="space-y-5">
      {/* Title & Description */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Create Account
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Join NexaChain to start earning daily ROI and multi-tier referral rewards
        </p>
      </div>

      {/* Backend API Error Banner */}
      <ErrorMessage
        title="Registration Failed"
        message={apiError?.message}
        errors={apiError?.errors}
      />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* ROW 1: Full Name & Email Address (2-Column Grid on sm+) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <FormField
            id="register-name"
            label="Full Name"
            required
            error={formErrors.name}
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
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
                className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-950/90 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all ${
                  formErrors.name
                    ? 'border-rose-500/80 focus:border-rose-500'
                    : 'border-slate-800 focus:border-emerald-500'
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
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="register-email"
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
        </div>

        {/* ROW 2: Mobile Number (with +91 country code prefix) */}
        <FormField
          id="register-mobile"
          label="Mobile Number"
          required
          error={formErrors.mobileNumber}
        >
          <div className="relative flex rounded-xl">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 border border-r-0 border-slate-800 rounded-l-xl text-xs font-mono font-semibold text-slate-300 select-none shrink-0">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>+91</span>
            </div>
            <input
              id="register-mobile"
              name="mobileNumber"
              type="tel"
              autoComplete="tel"
              maxLength={10}
              value={formData.mobileNumber}
              onChange={handleChange}
              placeholder="9876543210"
              className={`w-full px-3.5 py-2.5 bg-slate-950/90 border rounded-r-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all ${
                formErrors.mobileNumber
                  ? 'border-rose-500/80 focus:border-rose-500'
                  : 'border-slate-800 focus:border-emerald-500'
              }`}
            />
          </div>
        </FormField>

        {/* ROW 3: Password & Confirm Password (2-Column Grid on sm+) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Password */}
          <FormField
            id="register-password"
            label="Password"
            required
            error={formErrors.password}
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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

          {/* Confirm Password */}
          <FormField
            id="register-confirm-password"
            label="Confirm Password"
            required
            error={formErrors.confirmPassword}
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••••••"
                className={`w-full pl-10 pr-10 py-2.5 bg-slate-950/90 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all ${
                  formErrors.confirmPassword
                    ? 'border-rose-500/80 focus:border-rose-500'
                    : isPasswordMatch
                    ? 'border-emerald-500/80 focus:border-emerald-500'
                    : 'border-slate-800 focus:border-emerald-500'
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
                {isPasswordMatch && (
                  <div className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </FormField>
        </div>

        {/* Live Password Strength Meter Row */}
        {formData.password && (
          <div className="space-y-1.5 -mt-1 pb-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Minimum 8 characters with 1 letter & 1 number</span>
              <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
              <div
                className={`h-full ${strength.color} transition-all duration-300 rounded-full`}
                style={{ width: strength.width }}
              />
            </div>
          </div>
        )}

        {/* ROW 3: Referral Code (Optional) with Sponsor Pill */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="register-referral-code" className="font-semibold text-slate-300">
              Referral Code <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              If invited by a sponsor, enter their 8-character code
            </span>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Key className="w-4 h-4 text-emerald-500/70" />
            </div>
            <input
              id="register-referral-code"
              name="referralCode"
              type="text"
              value={formData.referralCode}
              onChange={handleChange}
              placeholder="e.g. A1B2C3D4"
              className={`w-full pl-10 pr-40 py-2.5 bg-slate-950/90 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono uppercase tracking-wider transition-all ${
                formErrors.referralCode ? 'border-rose-500/80' : 'border-slate-800 focus:border-emerald-500'
              }`}
            />
            {/* Referral Code Applied Pill */}
            {isReferralValid && (
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-semibold text-slate-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Code Applied
                </span>
              </div>
            )}
          </div>
          {formErrors.referralCode && (
            <p className="text-xs text-rose-400 mt-1">{formErrors.referralCode}</p>
          )}
        </div>

        {/* ROW 4: Terms & Protocol Agreement Checkbox */}
        <div className="pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer group select-none">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (formErrors.terms) {
                  setFormErrors((prev) => ({ ...prev, terms: '' }));
                }
              }}
              className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950 accent-emerald-500 cursor-pointer"
            />
            <span className="text-xs text-slate-400 leading-snug">
              I agree to the NexaChain{' '}
              <span className="text-slate-200 font-medium hover:text-emerald-400 underline-offset-2 hover:underline">
                Protocol Terms
              </span>
              ,{' '}
              <span className="text-slate-200 font-medium hover:text-emerald-400 underline-offset-2 hover:underline">
                Yield Risk Disclosure
              </span>{' '}
              &{' '}
              <span className="text-slate-200 font-medium hover:text-emerald-400 underline-offset-2 hover:underline">
                Privacy Policy
              </span>
            </span>
          </label>
          {formErrors.terms && (
            <p className="text-xs text-rose-400 mt-1">{formErrors.terms}</p>
          )}
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
              <span>Creating NexaChain Account...</span>
            </span>
          ) : (
            <>
              <span>Create NexaChain Account</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </>
          )}
        </button>
      </form>

      {/* Already Have An Account Link */}
      <div className="text-center pt-2 text-xs text-slate-400">
        Already have a portfolio account?{' '}
        <Link
          to="/login"
          className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-0.5 underline-offset-2 hover:underline transition-colors ml-1"
        >
          <span>Sign In Instead</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
