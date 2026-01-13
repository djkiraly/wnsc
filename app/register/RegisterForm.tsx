'use client';

import { useState } from 'react';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import { AlertCircle, CheckCircle, Loader2, Mail, User, Lock, Eye, EyeOff } from 'lucide-react';

interface RegisterFormProps {
  recaptchaSiteKey: string | null;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'success_no_email' | 'error';

export default function RegisterForm({ recaptchaSiteKey }: RegisterFormProps) {
  const { isReady, executeRecaptcha } = useRecaptcha(recaptchaSiteKey);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [resending, setResending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): string | null => {
    if (formData.name.trim().length < 2) {
      return 'Name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address.';
    }

    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters.';
    }

    if (!/[A-Z]/.test(formData.password)) {
      return 'Password must contain at least one uppercase letter.';
    }

    if (!/[a-z]/.test(formData.password)) {
      return 'Password must contain at least one lowercase letter.';
    }

    if (!/[0-9]/.test(formData.password)) {
      return 'Password must contain at least one number.';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match.';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side validation
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setStatus('submitting');

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await executeRecaptcha('register');

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Check if email was sent successfully
        if (data.emailSent) {
          setStatus('success');
        } else {
          setStatus('success_no_email');
          setErrorMessage(data.emailError || 'Email service unavailable');
        }
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
      } else {
        setErrorMessage(data.error || 'Failed to resend email');
      }
    } catch (error) {
      setErrorMessage('Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  // Success state
  if (status === 'success') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Check Your Email
        </h2>
        <p className="text-gray-600 mb-4">
          We&apos;ve sent a verification link to <strong>{formData.email}</strong>.
          Please click the link to verify your email address.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Verify your email by clicking the link we sent</li>
            <li>An administrator will review your registration</li>
            <li>You&apos;ll receive an email once your account is approved</li>
          </ol>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Didn&apos;t receive the email? Check your spam folder or{' '}
          <button
            onClick={handleResendEmail}
            disabled={resending}
            className="text-primary hover:underline"
          >
            {resending ? 'Sending...' : 'resend it'}
          </button>
        </p>
      </div>
    );
  }

  // Success but email failed state
  if (status === 'success_no_email') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Account Created
        </h2>
        <p className="text-gray-600 mb-4">
          Your account has been created, but we couldn&apos;t send the verification email.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left mb-4">
          <h3 className="font-medium text-amber-900 mb-2">Email Issue</h3>
          <p className="text-sm text-amber-800">
            {errorMessage || 'The email service is currently unavailable.'}
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleResendEmail}
            disabled={resending}
            className="btn btn-primary w-full justify-center"
          >
            {resending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Resend Verification Email
              </>
            )}
          </button>
          <p className="text-sm text-gray-500">
            Or contact an administrator at{' '}
            <a href="mailto:info@westernnebraskasports.org" className="text-primary hover:underline">
              info@westernnebraskasports.org
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      {status === 'error' && errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label htmlFor="name" className="label">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input pl-10"
              placeholder="John Smith"
              autoComplete="name"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="label">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input pl-10"
              placeholder="john@example.com"
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="label">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input pl-10 pr-10"
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            At least 8 characters with uppercase, lowercase, and number
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="input pl-10 pr-10"
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* reCAPTCHA Notice */}
        {recaptchaSiteKey && (
          <p className="text-xs text-gray-500">
            This site is protected by reCAPTCHA and the Google{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Privacy Policy
            </a>{' '}
            and{' '}
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Terms of Service
            </a>{' '}
            apply.
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={status === 'submitting' || (recaptchaSiteKey !== null && !isReady)}
          className="w-full btn btn-primary"
        >
          {status === 'submitting' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Registration Process</h3>
        <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
          <li>Create your account with the form above</li>
          <li>Verify your email address via the link we send</li>
          <li>Wait for an administrator to approve your account</li>
          <li>Once approved, you can sign in to the admin portal</li>
        </ol>
      </div>
    </div>
  );
}
