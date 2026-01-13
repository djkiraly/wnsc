'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Clock, Mail } from 'lucide-react';

type VerificationStatus = 'loading' | 'success' | 'already_verified' | 'error';

function VerificationContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          if (data.alreadyVerified) {
            setStatus('already_verified');
          } else {
            setStatus('success');
          }
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      {status === 'loading' && (
        <>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verifying Your Email
          </h2>
          <p className="text-gray-600">
            Please wait while we verify your email address...
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Email Verified!
          </h2>
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-6">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Awaiting Approval</h3>
                <p className="text-sm text-blue-800 mt-1">
                  Your account is now pending administrator approval. You&apos;ll receive
                  an email once your account has been reviewed and approved.
                </p>
              </div>
            </div>
          </div>
          <Link href="/" className="btn btn-primary">
            Return to Homepage
          </Link>
        </>
      )}

      {status === 'already_verified' && (
        <>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Already Verified
          </h2>
          <p className="text-gray-600 mb-6">
            Your email address has already been verified.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="btn btn-primary">
              Sign In
            </Link>
            <Link href="/" className="btn btn-secondary">
              Return to Homepage
            </Link>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verification Failed
          </h2>
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left mb-6">
            <h3 className="font-medium text-gray-900 mb-2">What can you do?</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Check if you used the correct link from your email</li>
              <li>Request a new verification email if the link expired</li>
              <li>Contact support if you continue to have issues</li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="btn btn-primary">
              Register Again
            </Link>
            <Link href="/contact" className="btn btn-secondary">
              Contact Support
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Loading...
      </h2>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-primary hover:text-primary-700">
            WNSC
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Email Verification</h1>
        </div>

        <Suspense fallback={<LoadingFallback />}>
          <VerificationContent />
        </Suspense>
      </div>
    </div>
  );
}
