'use client';

import { useState, useEffect } from 'react';
import {
  HardDrive,
  Link,
  Unlink,
  Upload,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  FileText,
} from 'lucide-react';

interface GCSStatus {
  isConnected: boolean;
  projectId: string | null;
  bucketName: string | null;
  connectedAt: string | null;
  hasEnvConfig: boolean;
  usingEnvConfig: boolean;
}

export default function StorageSettings() {
  const [status, setStatus] = useState<GCSStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form for new connection
  const [formData, setFormData] = useState({
    projectId: '',
    clientEmail: '',
    privateKey: '',
    bucketName: '',
  });
  const [useJsonKey, setUseJsonKey] = useState(true);
  const [jsonKeyFile, setJsonKeyFile] = useState<string>('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/gcs/status');
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch GCS status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJsonKeyParse = (jsonString: string) => {
    try {
      const key = JSON.parse(jsonString);
      setFormData({
        projectId: key.project_id || '',
        clientEmail: key.client_email || '',
        privateKey: key.private_key || '',
        bucketName: formData.bucketName,
      });
      setJsonKeyFile(jsonString);
    } catch (err) {
      alert('Invalid JSON key file format');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleJsonKeyParse(content);
    };
    reader.readAsText(file);
  };

  const handleConfigure = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectId || !formData.clientEmail || !formData.privateKey || !formData.bucketName) {
      alert('Please fill in all fields');
      return;
    }

    setConfiguring(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/gcs/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult({ success: true, message: 'Google Cloud Storage configured successfully!' });
        fetchStatus();
        // Reset form
        setFormData({ projectId: '', clientEmail: '', privateKey: '', bucketName: '' });
        setJsonKeyFile('');
      } else {
        setTestResult({ success: false, message: data.error || 'Configuration failed' });
      }
    } catch (err) {
      setTestResult({ success: false, message: 'An error occurred during configuration' });
    } finally {
      setConfiguring(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Cloud Storage? File uploads will fall back to environment variables if configured.')) {
      return;
    }

    setDisconnecting(true);

    try {
      const response = await fetch('/api/gcs/disconnect', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setStatus((prev) =>
          prev
            ? { ...prev, isConnected: false, projectId: null, bucketName: null, connectedAt: null }
            : null
        );
        fetchStatus();
      } else {
        alert(data.error || 'Failed to disconnect');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/gcs/test', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setTestResult({ success: true, message: data.message });
      } else {
        setTestResult({ success: false, message: data.error || 'Test failed' });
      }
    } catch (err) {
      setTestResult({ success: false, message: 'An error occurred during testing' });
    } finally {
      setTesting(false);
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
      {/* Test Result Message */}
      {testResult && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            testResult.success
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {testResult.success ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {testResult.message}
        </div>
      )}

      {/* Connection Status Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Google Cloud Storage Status
          </h2>
        </div>
        <div className="card-body">
          {status?.isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Connected</p>
                  <p className="text-sm text-green-600">
                    Project: {status.projectId} | Bucket: {status.bucketName}
                  </p>
                  {status.connectedAt && (
                    <p className="text-xs text-green-500 mt-1">
                      Connected on {new Date(status.connectedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>

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
                  {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                </button>
              </div>
            </div>
          ) : status?.usingEnvConfig ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Info className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Using Environment Variables</p>
                  <p className="text-sm text-blue-600">
                    GCS is configured via environment variables. You can override this by
                    configuring below.
                  </p>
                </div>
              </div>

              <button
                onClick={handleTest}
                disabled={testing}
                className="btn btn-secondary flex items-center gap-2"
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Not Connected</p>
                <p className="text-sm text-yellow-600">
                  Configure Google Cloud Storage below to enable file uploads.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configure GCS Card */}
      {!status?.isConnected && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Link className="h-5 w-5" />
              Configure Google Cloud Storage
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
                <li>Enable the Cloud Storage API</li>
                <li>Create a Cloud Storage bucket</li>
                <li>
                  Go to IAM &amp; Admin → Service Accounts → Create Service Account
                </li>
                <li>Grant the service account &quot;Storage Object Admin&quot; role</li>
                <li>Create a JSON key for the service account</li>
                <li>Upload or paste the JSON key below</li>
              </ol>
            </div>

            {/* Toggle between JSON upload and manual entry */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setUseJsonKey(true)}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                  useJsonKey
                    ? 'border-primary bg-primary-50 text-primary'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Upload JSON Key
              </button>
              <button
                type="button"
                onClick={() => setUseJsonKey(false)}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                  !useJsonKey
                    ? 'border-primary bg-primary-50 text-primary'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Manual Entry
              </button>
            </div>

            <form onSubmit={handleConfigure} className="space-y-4">
              {useJsonKey ? (
                <div className="space-y-4">
                  <div>
                    <label className="label">Service Account JSON Key</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="json-key-file"
                      />
                      <label
                        htmlFor="json-key-file"
                        className="cursor-pointer text-primary hover:text-primary-600"
                      >
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <span className="font-medium">Click to upload JSON key file</span>
                      </label>
                      {jsonKeyFile && (
                        <p className="mt-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4 inline mr-1" />
                          JSON key loaded successfully
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Or paste the JSON content below:
                    </p>
                    <textarea
                      value={jsonKeyFile}
                      onChange={(e) => handleJsonKeyParse(e.target.value)}
                      className="textarea mt-2 font-mono text-xs"
                      rows={4}
                      placeholder='{"type": "service_account", "project_id": "...", ...}'
                    />
                  </div>

                  <div>
                    <label className="label">Bucket Name</label>
                    <input
                      type="text"
                      value={formData.bucketName}
                      onChange={(e) =>
                        setFormData({ ...formData, bucketName: e.target.value })
                      }
                      className="input"
                      placeholder="my-bucket-name"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The name of your Cloud Storage bucket
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="label">Project ID</label>
                    <input
                      type="text"
                      value={formData.projectId}
                      onChange={(e) =>
                        setFormData({ ...formData, projectId: e.target.value })
                      }
                      className="input"
                      placeholder="my-project-id"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Service Account Email</label>
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, clientEmail: e.target.value })
                      }
                      className="input"
                      placeholder="service-account@project.iam.gserviceaccount.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Private Key</label>
                    <textarea
                      value={formData.privateKey}
                      onChange={(e) =>
                        setFormData({ ...formData, privateKey: e.target.value })
                      }
                      className="textarea font-mono text-xs"
                      rows={4}
                      placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Bucket Name</label>
                    <input
                      type="text"
                      value={formData.bucketName}
                      onChange={(e) =>
                        setFormData({ ...formData, bucketName: e.target.value })
                      }
                      className="input"
                      placeholder="my-bucket-name"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={configuring}
                className="btn btn-primary flex items-center gap-2"
              >
                {configuring ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link className="h-4 w-4" />
                )}
                {configuring ? 'Configuring...' : 'Configure Storage'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Usage Information */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Info className="h-5 w-5" />
            Usage Information
          </h2>
        </div>
        <div className="card-body">
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              Google Cloud Storage is used to store all uploaded files including:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Event images and banners</li>
              <li>Document attachments</li>
              <li>Media files for the website</li>
              <li>User-uploaded content</li>
            </ul>
            <p className="mt-3">
              <strong>Supported file types:</strong> Images (JPEG, PNG, GIF, WebP, SVG),
              Documents (PDF, Word, Excel), Text files (TXT, CSV)
            </p>
            <p>
              <strong>Maximum file size:</strong> 10MB per file
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
