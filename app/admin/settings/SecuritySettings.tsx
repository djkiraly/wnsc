'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Shield, ExternalLink, AlertTriangle, ToggleLeft, ToggleRight, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface SecuritySettingsProps {
  settings: Record<string, string>;
}

export default function SecuritySettings({ settings }: SecuritySettingsProps) {
  const router = useRouter();

  const [recaptchaSettings, setRecaptchaSettings] = useState({
    recaptcha_enabled: settings.recaptcha_enabled === 'true',
    recaptcha_site_key: settings.recaptcha_site_key || '',
    recaptcha_secret_key: settings.recaptcha_secret_key || '',
    recaptcha_threshold: settings.recaptcha_threshold || '0.5',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setTestResult(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recaptcha_enabled: String(recaptchaSettings.recaptcha_enabled),
          recaptcha_site_key: recaptchaSettings.recaptcha_site_key,
          recaptcha_secret_key: recaptchaSettings.recaptcha_secret_key,
          recaptcha_threshold: recaptchaSettings.recaptcha_threshold,
        }),
      });

      if (response.ok) {
        // Invalidate the server-side cache
        await fetch('/api/settings/invalidate-cache', { method: 'POST' });
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/settings/test-recaptcha', {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        setTestResult({ success: true, message: data.message || 'reCAPTCHA configuration is valid!' });
      } else {
        setTestResult({ success: false, message: data.error || 'Test failed' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to test configuration' });
    } finally {
      setTesting(false);
    }
  };

  const isConfigured = recaptchaSettings.recaptcha_site_key && recaptchaSettings.recaptcha_secret_key;
  const isEnabled = recaptchaSettings.recaptcha_enabled && isConfigured;

  return (
    <div className="space-y-6">
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          Security settings saved successfully!
        </div>
      )}

      {/* reCAPTCHA Settings */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">reCAPTCHA Settings</h2>
              <p className="text-sm text-gray-500 mt-1">
                Protect your forms from spam and abuse with Google reCAPTCHA v3
              </p>
            </div>
          </div>
        </div>

        <div className="card-body space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Enable reCAPTCHA Protection</h3>
              <p className="text-sm text-gray-500">
                {recaptchaSettings.recaptcha_enabled
                  ? 'Forms are protected from spam and abuse'
                  : 'reCAPTCHA protection is currently disabled'}
              </p>
            </div>
            <button
              onClick={() =>
                setRecaptchaSettings({
                  ...recaptchaSettings,
                  recaptcha_enabled: !recaptchaSettings.recaptcha_enabled,
                })
              }
              className={`p-2 rounded-lg transition-colors ${
                recaptchaSettings.recaptcha_enabled
                  ? 'text-green-600 hover:bg-green-50'
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              {recaptchaSettings.recaptcha_enabled ? (
                <ToggleRight className="h-8 w-8" />
              ) : (
                <ToggleLeft className="h-8 w-8" />
              )}
            </button>
          </div>

          {/* Status */}
          <div className={`p-4 rounded-lg ${
            isEnabled
              ? 'bg-green-50 border border-green-200'
              : !recaptchaSettings.recaptcha_enabled
                ? 'bg-gray-50 border border-gray-200'
                : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-start gap-3">
              {isEnabled ? (
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              ) : !recaptchaSettings.recaptcha_enabled ? (
                <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${
                  isEnabled
                    ? 'text-green-800'
                    : !recaptchaSettings.recaptcha_enabled
                      ? 'text-gray-600'
                      : 'text-yellow-800'
                }`}>
                  {isEnabled
                    ? 'reCAPTCHA is active'
                    : !recaptchaSettings.recaptcha_enabled
                      ? 'reCAPTCHA is disabled'
                      : 'reCAPTCHA keys not configured'}
                </p>
                <p className={`text-sm ${
                  isEnabled
                    ? 'text-green-700'
                    : !recaptchaSettings.recaptcha_enabled
                      ? 'text-gray-500'
                      : 'text-yellow-700'
                }`}>
                  {isEnabled
                    ? 'Forms are protected from automated submissions'
                    : !recaptchaSettings.recaptcha_enabled
                      ? 'Enable above and configure keys to protect your forms'
                      : 'Enter your Site Key and Secret Key below'}
                </p>
              </div>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Setup Instructions</h3>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>
                Go to the{' '}
                <a
                  href="https://www.google.com/recaptcha/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Google reCAPTCHA Admin Console
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Click &quot;Create&quot; (+ icon) to register a new site</li>
              <li>Choose &quot;reCAPTCHA v3&quot; as the type</li>
              <li>Add your domain(s) to the list</li>
              <li>Copy the Site Key and Secret Key below</li>
            </ol>
          </div>

          {/* Site Key */}
          <div>
            <label className="label">Site Key (Public)</label>
            <input
              type="text"
              value={recaptchaSettings.recaptcha_site_key}
              onChange={(e) =>
                setRecaptchaSettings({
                  ...recaptchaSettings,
                  recaptcha_site_key: e.target.value,
                })
              }
              className="input font-mono text-sm"
              placeholder="6Lc..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This key is used in the frontend and is visible to users
            </p>
          </div>

          {/* Secret Key */}
          <div>
            <label className="label">Secret Key (Private)</label>
            <input
              type="password"
              value={recaptchaSettings.recaptcha_secret_key}
              onChange={(e) =>
                setRecaptchaSettings({
                  ...recaptchaSettings,
                  recaptcha_secret_key: e.target.value,
                })
              }
              className="input font-mono text-sm"
              placeholder="6Lc..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This key is used server-side to verify tokens. Keep it secret!
            </p>
          </div>

          {/* Score Threshold */}
          <div>
            <label className="label">Score Threshold</label>
            <select
              value={recaptchaSettings.recaptcha_threshold}
              onChange={(e) =>
                setRecaptchaSettings({
                  ...recaptchaSettings,
                  recaptcha_threshold: e.target.value,
                })
              }
              className="input"
            >
              <option value="0.3">0.3 (More permissive)</option>
              <option value="0.5">0.5 (Balanced - Recommended)</option>
              <option value="0.7">0.7 (More strict)</option>
              <option value="0.9">0.9 (Very strict)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              reCAPTCHA v3 returns a score from 0.0 to 1.0. Higher scores indicate more likely human interaction.
              Submissions below this threshold will be rejected.
            </p>
          </div>

          {/* Environment Variables Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Environment Variables</h4>
            <p className="text-sm text-blue-700 mb-2">
              For production, you can also set these as environment variables:
            </p>
            <code className="text-xs bg-blue-100 px-2 py-1 rounded block mb-1">
              NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
            </code>
            <code className="text-xs bg-blue-100 px-2 py-1 rounded block mb-1">
              RECAPTCHA_SECRET_KEY=your_secret_key
            </code>
            <code className="text-xs bg-blue-100 px-2 py-1 rounded block">
              RECAPTCHA_THRESHOLD=0.5
            </code>
          </div>
        </div>
      </div>

      {/* Protected Forms Info */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Protected Forms</h2>
        </div>
        <div className="card-body">
          <p className="text-sm text-gray-600 mb-4">
            The following forms are protected by reCAPTCHA when enabled:
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <Shield className={`h-4 w-4 ${isEnabled ? 'text-green-500' : 'text-gray-300'}`} />
              <span>User Registration (/register)</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Shield className={`h-4 w-4 ${isEnabled ? 'text-green-500' : 'text-gray-300'}`} />
              <span>Event Submission Form (/submit-event)</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Shield className={`h-4 w-4 ${isEnabled ? 'text-green-500' : 'text-gray-300'}`} />
              <span>Contact Form (/contact)</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Shield className={`h-4 w-4 ${isEnabled ? 'text-green-500' : 'text-gray-300'}`} />
              <span>Newsletter Subscription</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
          testResult.success
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          {testResult.success ? (
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          )}
          <div>
            <p className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {testResult.success ? 'Test Passed' : 'Test Failed'}
            </p>
            <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
              {testResult.message}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handleTest}
          className="btn btn-secondary"
          disabled={testing || !isConfigured}
        >
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Test Configuration
            </>
          )}
        </button>
        <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Security Settings'}
        </button>
      </div>
    </div>
  );
}
