'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, CheckCircle, Send, Loader2, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface UnverifiedUserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
  };
}

export default function UnverifiedUserCard({ user }: UnverifiedUserCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<'verify' | 'resend' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleManualVerify = async () => {
    setLoading('verify');
    setMessage(null);

    try {
      const response = await fetch(`/api/users/${user.id}/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify' }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Email verified successfully' });
        setTimeout(() => router.refresh(), 1000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to verify' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setLoading(null);
    }
  };

  const handleResendEmail = async () => {
    setLoading('resend');
    setMessage(null);

    try {
      const response = await fetch(`/api/users/${user.id}/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend' }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Verification email sent' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send email' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="card p-4 border-yellow-200 bg-yellow-50/50">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-yellow-200 text-yellow-700 flex items-center justify-center font-semibold flex-shrink-0">
          {user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{user.name}</div>
          <div className="flex items-center gap-1 text-sm text-gray-500 truncate">
            <Mail className="h-3 w-3 flex-shrink-0" />
            {user.email}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
            <Calendar className="h-3 w-3" />
            Registered {formatDate(user.createdAt)}
          </div>
        </div>
      </div>

      {message && (
        <div className={`text-sm p-2 rounded mb-3 ${
          message.type === 'success'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleManualVerify}
          disabled={loading !== null}
          className="flex-1 btn btn-secondary text-sm py-2"
          title="Manually mark email as verified"
        >
          {loading === 'verify' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-1" />
              Verify
            </>
          )}
        </button>
        <button
          onClick={handleResendEmail}
          disabled={loading !== null}
          className="flex-1 btn btn-primary text-sm py-2"
          title="Resend verification email"
        >
          {loading === 'resend' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4 mr-1" />
              Resend
            </>
          )}
        </button>
      </div>
    </div>
  );
}
