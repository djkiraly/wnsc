'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Mail,
  Link,
  Unlink,
  Send,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
} from 'lucide-react';

interface GmailStatus {
  isConnected: boolean;
  connectedEmail: string | null;
  connectedAt: string | null;
  hasEnvConfig: boolean;
  usingEnvConfig: boolean;
}

function EmailSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  // Form for new connection
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  // Success/Error from URL params
  const success = searchParams.get('success');
  const error = searchParams.get('error');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/gmail/status');
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch Gmail status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !clientSecret) {
      alert('Please enter both Client ID and Client Secret');
      return;
    }

    setConnecting(true);
    try {
      const response = await fetch('/api/gmail/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret }),
      });

      const data = await response.json();
      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        alert(data.error || 'Failed to start OAuth flow');
        setConnecting(false);
      }
    } catch (err) {
      alert('An error occurred');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !confirm(
        'Are you sure you want to disconnect Gmail? Email sending will fall back to environment variables if configured.'
      )
    ) {
      return;
    }

    setDisconnecting(true);
    try {
      const response = await fetch('/api/gmail/disconnect', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        setStatus((prev) =>
          prev
            ? { ...prev, isConnected: false, connectedEmail: null, connectedAt: null }
            : null
        );
        setClientId('');
        setClientSecret('');
        fetchStatus();
        router.refresh();
      } else {
        alert(data.error || 'Failed to disconnect');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      alert('Please enter an email address');
      return;
    }

    setTestingEmail(true);
    try {
      const response = await fetch('/api/gmail/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Test email sent successfully!');
      } else {
        alert(data.error || 'Failed to send test email');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setTestingEmail(false);
    }
  };

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'unauthorized':
        return 'You must be a Super Admin to configure email settings.';
      case 'invalid_state':
        return 'OAuth session expired. Please try again.';
      case 'state_mismatch':
        return 'Security validation failed. Please try again.';
      case 'no_refresh_token':
        return 'Failed to obtain refresh token. Please try again and ensure you grant all permissions.';
      case 'callback_failed':
        return 'OAuth callback failed. Please try again.';
      case 'missing_params':
        return 'Missing OAuth parameters. Please try again.';
      case 'access_denied':
        return 'Access was denied. Please try again and grant the required permissions.';
      default:
        return `Error: ${errorCode}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success === 'connected' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800">
          <CheckCircle className="h-5 w-5" />
          Gmail connected successfully!
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
          <AlertCircle className="h-5 w-5" />
          {getErrorMessage(error)}
        </div>
      )}

      {/* Connection Status Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gmail Connection Status
          </h2>
        </div>
        <div className="card-body">
          {status?.isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Connected</p>
                  <p className="text-sm text-green-600">{status.connectedEmail}</p>
                  {status.connectedAt && (
                    <p className="text-xs text-green-500 mt-1">
                      Connected on{' '}
                      {new Date(status.connectedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="btn btn-danger flex items-center gap-2"
              >
                {disconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unlink className="h-4 w-4" />
                )}
                {disconnecting ? 'Disconnecting...' : 'Disconnect Gmail'}
              </button>
            </div>
          ) : status?.usingEnvConfig ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Info className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">
                    Using Environment Variables
                  </p>
                  <p className="text-sm text-blue-600">
                    Gmail is configured via environment variables. You can override
                    this by connecting below.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Not Connected</p>
                <p className="text-sm text-yellow-600">
                  Configure Gmail below to enable email sending.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connect Gmail Card */}
      {!status?.isConnected && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Link className="h-5 w-5" />
              Connect Gmail Account
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p className="font-medium mb-2">Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Go to{' '}
                  <a
                    href="https://console.cloud.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Google Cloud Console
                  </a>
                </li>
                <li>Create a new project or select an existing one</li>
                <li>Enable the Gmail API</li>
                <li>
                  Configure OAuth consent screen (External, add your email as test
                  user)
                </li>
                <li>Create OAuth 2.0 credentials (Web application)</li>
                <li>
                  Add{' '}
                  <code className="bg-gray-200 px-1 rounded text-xs">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}/api/gmail/callback`
                      : '/api/gmail/callback'}
                  </code>{' '}
                  as an authorized redirect URI
                </li>
                <li>Copy the Client ID and Client Secret below</li>
              </ol>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label htmlFor="clientId" className="label">
                  Client ID
                </label>
                <input
                  type="text"
                  id="clientId"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="input"
                  placeholder="xxxxxx.apps.googleusercontent.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="clientSecret" className="label">
                  Client Secret
                </label>
                <input
                  type="password"
                  id="clientSecret"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="input"
                  placeholder="GOCSPX-xxxxxx"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={connecting}
                className="btn btn-primary flex items-center gap-2"
              >
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link className="h-4 w-4" />
                )}
                {connecting ? 'Connecting...' : 'Connect Gmail'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Test Email Card */}
      {(status?.isConnected || status?.usingEnvConfig) && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Send className="h-5 w-5" />
              Test Email
            </h2>
          </div>
          <div className="card-body">
            <p className="text-sm text-gray-600 mb-4">
              Send a test email to verify the Gmail integration is working correctly.
            </p>
            <div className="flex gap-4">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="input flex-1"
                placeholder="Enter email address to send test"
              />
              <button
                onClick={handleTestEmail}
                disabled={testingEmail}
                className="btn btn-secondary flex items-center gap-2"
              >
                {testingEmail ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {testingEmail ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Troubleshooting Card */}
      {(status?.isConnected || status?.usingEnvConfig) && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Troubleshooting
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-medium text-amber-900 mb-2">
                Emails not being received?
              </h3>
              <p className="text-sm text-amber-800 mb-3">
                If the Gmail API returns success but emails aren&apos;t arriving, check these common issues:
              </p>
              <ol className="text-sm text-amber-700 list-decimal list-inside space-y-2">
                <li>
                  <strong>Check spam folder</strong> - New OAuth apps often trigger spam filters
                </li>
                <li>
                  <strong>Google Cloud Console &quot;Testing&quot; mode</strong> - If your app is in testing mode,
                  only users added as &quot;Test users&quot; in the OAuth consent screen can receive emails.
                  Either add recipients as test users, or publish your app to production.
                </li>
                <li>
                  <strong>Verify sender email</strong> - The &quot;From&quot; address must match the
                  connected Gmail account: <strong>{status?.connectedEmail || 'Not set'}</strong>
                </li>
              </ol>
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">To fix Testing mode:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Cloud Console → OAuth consent screen</a></li>
                <li>Either add recipient emails as &quot;Test users&quot;</li>
                <li>Or click &quot;Publish App&quot; to move to production</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmailSettingsFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
}

export default function EmailSettings() {
  return (
    <Suspense fallback={<EmailSettingsFallback />}>
      <EmailSettingsContent />
    </Suspense>
  );
}
