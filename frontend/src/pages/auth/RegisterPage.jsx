import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../../features/auth/authApi';
import { FormField } from '../../components/common/FormField';
import { AppButton } from '../../components/common/AppButton';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [registerUser, { isLoading, error: apiError }] = useRegisterMutation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    referralCode: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password
    };
    if (formData.referralCode.trim()) {
      payload.referralCode = formData.referralCode.trim().toUpperCase();
    }

    try {
      await registerUser(payload).unwrap();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // Handled by apiError
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">Create Account</h3>
        <p className="text-xs text-slate-400 mt-1">
          Join NexaChain to start earning automated daily ROI and referral rewards
        </p>
      </div>

      <ErrorMessage
        title="Registration Failed"
        message={apiError?.message}
        errors={apiError?.errors}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          id="name"
          label="Full Name"
          required
          error={formErrors.name}
        >
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </FormField>

        <FormField
          id="email"
          label="Email Address"
          required
          error={formErrors.email}
        >
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </FormField>

        <FormField
          id="password"
          label="Password"
          required
          error={formErrors.password}
          hint="Minimum 8 characters with at least one letter and one number"
        >
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </FormField>

        <FormField
          id="referralCode"
          label="Referral Code (Optional)"
          error={formErrors.referralCode}
          hint="If invited by a friend, enter their 8-character referral code"
        >
          <input
            id="referralCode"
            name="referralCode"
            type="text"
            value={formData.referralCode}
            onChange={handleChange}
            placeholder="e.g. A1B2C3D4"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase tracking-wider transition-all"
          />
        </FormField>

        <AppButton
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="w-full mt-2"
        >
          Create Account
        </AppButton>
      </form>

      <div className="text-center pt-2 border-t border-slate-800 text-xs text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
          Sign In
        </Link>
      </div>
    </div>
  );
};
