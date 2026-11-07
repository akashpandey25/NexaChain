import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Key,
  Check,
  ArrowRight,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { useRegisterMutation } from '../../features/auth/authApi';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)/;
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

/**
 * RegisterPage Component
 * 
 * Recreates the Stitch Enterprise Registration specification:
 * - Clean vertical rhythm that prevents scrolling on desktop viewports
 * - Compact 2-column input grid for Name & Corporate/Personal Email
 * - Standardized Indian Mobile Number input with 🇮🇳 +91 selector badge
 * - 2-column input grid for Password & Confirm Password
 * - Dynamic password strength meter bar & score feedback
 * - Referral sponsor code input with Auto-Verified status & "VERIFIED TIER" badge
 * - Protocol Terms, Yield Risk Disclosure & Privacy Policy agreement checkbox
 * - Solid emerald primary CTA button
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
    if (!pass) return { score: 0, label: '', width: '0%', color: 'bg-slate-800', text: 'text-slate-500' };
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
    <div className="space-y-3 xl:space-y-3.5">
      {/* Title & Description */}
      <div>
        <h2 className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-white tracking-tight">
          Create Account
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-snug">
          Join NexaChain enterprise capital protocol and yield ledger telemetry.
        </p>
      </div>

      {/* Backend API Error Banner */}
      <ErrorMessage
        title="Registration Failed"
        message={apiError?.message}
        errors={apiError?.errors}
      />

      <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
        {/* ROW 1: Full Name & Email Address (2-Column Grid on sm+) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Full Name */}
          <div className="space-y-1">
            <label htmlFor="register-name" className="block text-xs font-medium text-slate-300">
              Full Legal Name <span className="text-emerald-400">*</span>
            </label>
            <div
              className={`relative flex items-center rounded-xl bg-[#060b14] border transition-all ${
                formErrors.name
                  ? 'border-rose-500/80 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500'
                  : 'border-[#1d273c] focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500'
              }`}
            >
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
                className="w-full pl-9 pr-3 py-2 bg-transparent text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
            {formErrors.name && (
              <p className="text-[11px] text-rose-400 mt-0.5 flex items-center gap-1">
                <span>•</span> {formErrors.name}
              </p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label htmlFor="register-email" className="block text-xs font-medium text-slate-300">
              Corporate / Personal Email <span className="text-emerald-400">*</span>
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
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="alex@nexachain.io"
                className="w-full pl-9 pr-3 py-2 bg-transparent text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
            {formErrors.email && (
              <p className="text-[11px] text-rose-400 mt-0.5 flex items-center gap-1">
                <span>•</span> {formErrors.email}
              </p>
            )}
          </div>
        </div>

        {/* ROW 2: Mobile Number (with Indian Flag & +91 country selector badge) */}
        <div className="space-y-1">
          <label htmlFor="register-mobile" className="block text-xs font-medium text-slate-300">
            Mobile Number <span className="text-emerald-400">*</span>
          </label>
          <div
            className={`relative flex items-center rounded-xl bg-[#060b14] border transition-all ${
              formErrors.mobileNumber
                ? 'border-rose-500/80 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500'
                : 'border-[#1d273c] focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500'
            }`}
          >
            <div className="pl-3 pr-2 flex items-center gap-1 select-none shrink-0 border-r border-[#1d273c] my-1.5 py-0.5">
              <span className="text-xs">🇮🇳</span>
              <span className="text-xs font-mono font-semibold text-slate-300">+91</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
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
              className="w-full pl-2.5 pr-3 py-2 bg-transparent text-xs sm:text-sm font-mono text-white placeholder-slate-600 focus:outline-none"
            />
          </div>
          {formErrors.mobileNumber && (
            <p className="text-[11px] text-rose-400 mt-0.5 flex items-center gap-1">
              <span>•</span> {formErrors.mobileNumber}
            </p>
          )}
        </div>

        {/* ROW 3: Password & Confirm Password (2-Column Grid on sm+) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="register-password" className="block text-xs font-medium text-slate-300">
              Password <span className="text-emerald-400">*</span>
            </label>
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
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-8 py-2 bg-transparent text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {formErrors.password && (
              <p id="register-password-error" className="text-[11px] text-rose-400 mt-0.5 flex items-center gap-1">
                <span>•</span> {formErrors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label htmlFor="register-confirm-password" className="block text-xs font-medium text-slate-300">
              Confirm Password <span className="text-emerald-400">*</span>
            </label>
            <div
              className={`relative flex items-center rounded-xl bg-[#060b14] border transition-all ${
                formErrors.confirmPassword
                  ? 'border-rose-500/80 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500'
                  : isPasswordMatch
                  ? 'border-emerald-500/80 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500'
                  : 'border-[#1d273c] focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500'
              }`}
            >
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
                placeholder="••••••••••••"
                className="w-full pl-9 pr-12 py-2 bg-transparent text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none"
              />
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
                {isPasswordMatch && (
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            {formErrors.confirmPassword && (
              <p id="register-confirm-password-error" className="text-[11px] text-rose-400 mt-0.5 flex items-center gap-1">
                <span>•</span> {formErrors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        {/* Live Password Strength Meter Bar */}
        {formData.password && (
          <div className="space-y-1 -mt-0.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Min 8 chars with 1 letter &amp; 1 number</span>
              <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
            </div>
            <div className="h-1 w-full bg-[#060b14] border border-[#1b253b] rounded-full overflow-hidden">
              <div
                className={`h-full ${strength.color} transition-all duration-300 rounded-full`}
                style={{ width: strength.width }}
              />
            </div>
          </div>
        )}

        {/* ROW 4: Referral Sponsor Code (Optional) with Auto-Verified Status */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="register-referral-code" className="font-medium text-slate-300">
              Referral Sponsor Code (Optional)
            </label>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {isReferralValid ? 'Auto-Verified: Shan (ID #8831)' : 'Auto-Verified Sponsor Network'}
            </span>
          </div>

          <div
            className={`relative flex items-center rounded-xl bg-[#060b14] border transition-all ${
              formErrors.referralCode
                ? 'border-rose-500/80'
                : 'border-[#1d273c] focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500'
            }`}
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Key className="w-4 h-4" />
            </div>
            <input
              id="register-referral-code"
              name="referralCode"
              type="text"
              value={formData.referralCode}
              onChange={handleChange}
              placeholder="E.G. NEXASHH2LU"
              className="w-full pl-9 pr-28 py-2 bg-transparent text-xs sm:text-sm font-mono uppercase tracking-wider text-white placeholder-slate-600 focus:outline-none"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
              <span className="text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-[#0c1624] border border-[#1b253b] text-slate-400 uppercase">
                Verified Tier
              </span>
            </div>
          </div>
          {formErrors.referralCode && (
            <p className="text-[11px] text-rose-400 mt-0.5 flex items-center gap-1">
              <span>•</span> {formErrors.referralCode}
            </p>
          )}
        </div>

        {/* ROW 5: Terms & Protocol Agreement Checkbox */}
        <div className="pt-0.5">
          <label className="flex items-start gap-2 cursor-pointer group select-none">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (formErrors.terms) {
                  setFormErrors((prev) => ({ ...prev, terms: '' }));
                }
              }}
              className="mt-0.5 w-3.5 h-3.5 rounded border-slate-700 bg-[#060b14] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer accent-emerald-500"
            />
            <span className="text-[11px] text-slate-300 leading-tight">
              I agree to the NexaChain{' '}
              <span className="text-emerald-400 hover:text-emerald-300 font-semibold underline-offset-2 hover:underline">
                Protocol Terms
              </span>
              ,{' '}
              <span className="text-emerald-400 hover:text-emerald-300 font-semibold underline-offset-2 hover:underline">
                Yield Risk Disclosure
              </span>
              , &amp;{' '}
              <span className="text-emerald-400 hover:text-emerald-300 font-semibold underline-offset-2 hover:underline">
                Privacy Policy
              </span>
              .
            </span>
          </label>
          {formErrors.terms && (
            <p className="text-[11px] text-rose-400 mt-0.5">{formErrors.terms}</p>
          )}
        </div>

        {/* Primary CTA Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-1 py-2.5 xl:py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a101d]"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>Creating NexaChain Account...</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span>Create NexaChain Account</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </button>

        {/* Already Have An Account Link */}
        <div className="pt-0.5 text-center">
          <p className="text-xs text-slate-400">
            Already have a portfolio account?{' '}
            <Link
              to="/login"
              className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <span>Sign In Instead</span>
              <span>↗</span>
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;