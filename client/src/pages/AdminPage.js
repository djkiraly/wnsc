import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  UserGroupIcon,
  CogIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import UserManagement from '../components/UserManagement';

const AdminPage = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  
  // General settings
  const [settings, setSettings] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  
  // Gmail integration
  const [gmailStatus, setGmailStatus] = useState({
    isConfigured: false,
    isEnabled: false,
    credentials: null
  });
  const [gmailLoading, setGmailLoading] = useState(false);
  
  // Email templates
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  
  // Email logs
  const [emailLogs, setEmailLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilters, setLogFilters] = useState({ status: 'all', limit: 50, offset: 0 });

  useEffect(() => {
    if (user?.role === 'admin' && activeSection === 'settings') {
      fetchSettings();
      fetchGmailStatus();
    }
  }, [user, activeSection]);

  useEffect(() => {
    if (activeSection === 'settings') {
      if (activeSettingsTab === 'templates') {
        fetchEmailTemplates();
      } else if (activeSettingsTab === 'logs') {
        fetchEmailLogs();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, activeSettingsTab, logFilters]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings');
      const settingsObj = {};
      response.data.settings.forEach(setting => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });
      setSettings(settingsObj);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    }
  };

  const fetchGmailStatus = async () => {
    try {
      const response = await axios.get('/api/settings/gmail/status');
      setGmailStatus(response.data);
    } catch (error) {
      console.error('Error fetching Gmail status:', error);
    }
  };

  const fetchEmailTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const response = await axios.get('/api/settings/email-templates');
      setEmailTemplates(response.data.templates);
    } catch (error) {
      console.error('Error fetching email templates:', error);
      toast.error('Failed to load email templates');
    } finally {
      setTemplatesLoading(false);
    }
  };

  const fetchEmailLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await axios.get('/api/settings/email-logs', { params: logFilters });
      setEmailLogs(response.data.logs);
    } catch (error) {
      console.error('Error fetching email logs:', error);
      toast.error('Failed to load email logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    setSettingsLoading(true);
    try {
      await axios.put(`/api/settings/${key}`, { value });
      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('Setting updated successfully');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
    } finally {
      setSettingsLoading(false);
    }
  };

  const initiateGmailAuth = async () => {
    setGmailLoading(true);
    try {
      const response = await axios.get('/api/settings/gmail/auth');
      const authWindow = window.open(response.data.authUrl, 'gmailAuth', 'width=500,height=600');
      
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          setGmailLoading(false);
          fetchGmailStatus();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error initiating Gmail auth:', error);
      toast.error('Failed to start Gmail authorization');
      setGmailLoading(false);
    }
  };

  const disconnectGmail = async () => {
    if (!window.confirm('Are you sure you want to disconnect Gmail integration?')) return;
    
    setGmailLoading(true);
    try {
      await axios.delete('/api/settings/gmail/disconnect');
      setGmailStatus({ isConfigured: false, isEnabled: false, credentials: null });
      toast.success('Gmail integration disconnected');
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      toast.error('Failed to disconnect Gmail');
    } finally {
      setGmailLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return <UserManagement />;
      case 'settings':
        const settingsTabs = [
          { id: 'general', name: 'General', icon: CogIcon },
          { id: 'gmail', name: 'Gmail Integration', icon: EnvelopeIcon },
          { id: 'templates', name: 'Email Templates', icon: DocumentTextIcon },
          { id: 'logs', name: 'Email Logs', icon: ChartBarIcon }
        ];

        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-sm text-gray-600">Configure system-wide settings and integrations</p>
            
            {/* Settings Tab Navigation */}
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                  {settingsTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSettingsTab(tab.id)}
                        className={`${
                          activeSettingsTab === tab.id
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm`}
                      >
                        <Icon
                          className={`${
                            activeSettingsTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                          } -ml-0.5 mr-2 h-5 w-5`}
                        />
                        {tab.name}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="p-6">
                {/* General Settings Tab */}
                {activeSettingsTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Email Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Email Functionality</label>
                            <p className="text-sm text-gray-500">Enable or disable all email features</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.email_enabled === 'true'}
                              onChange={(e) => updateSetting('email_enabled', e.target.checked ? 'true' : 'false')}
                              disabled={settingsLoading}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Default From Name
                          </label>
                          <input
                            type="text"
                            value={settings.default_from_name || ''}
                            onChange={(e) => updateSetting('default_from_name', e.target.value)}
                            disabled={settingsLoading}
                            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="West Nebraska Sports Council"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Daily Email Limit
                          </label>
                          <input
                            type="number"
                            value={settings.max_daily_emails || 100}
                            onChange={(e) => updateSetting('max_daily_emails', e.target.value)}
                            disabled={settingsLoading}
                            min="1"
                            max="1000"
                            className="block w-32 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                          <p className="mt-1 text-sm text-gray-500">Maximum emails that can be sent per day</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Default Email Signature
                          </label>
                          <textarea
                            value={settings.email_signature || ''}
                            onChange={(e) => updateSetting('email_signature', e.target.value)}
                            disabled={settingsLoading}
                            rows={4}
                            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Enter default email signature..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Gmail Integration Tab */}
                {activeSettingsTab === 'gmail' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Gmail API Integration</h3>
                      
                      {/* Google OAuth Configuration */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                        <h4 className="text-base font-medium text-gray-900 mb-4">Google OAuth Configuration</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Google Client ID
                            </label>
                            <input
                              type="text"
                              value={settings.google_client_id || ''}
                              onChange={(e) => updateSetting('google_client_id', e.target.value)}
                              disabled={settingsLoading}
                              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="Enter Google OAuth Client ID"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                              Obtain from Google Cloud Console → APIs & Services → Credentials
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Google Client Secret
                            </label>
                            <input
                              type="password"
                              value={settings.google_client_secret || ''}
                              onChange={(e) => updateSetting('google_client_secret', e.target.value)}
                              disabled={settingsLoading}
                              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="Enter Google OAuth Client Secret"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                              Keep this secure - it will be masked when saved
                            </p>
                          </div>

                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                            <h5 className="text-sm font-medium text-blue-900 mb-2">Setup Instructions:</h5>
                            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                              <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                              <li>Create a new project or select an existing one</li>
                              <li>Enable the Gmail API</li>
                              <li>Go to APIs & Services → Credentials</li>
                              <li>Create OAuth 2.0 Client IDs for a web application</li>
                              <li>Add your domain to authorized origins and redirect URIs</li>
                              <li>Copy the Client ID and Client Secret to the fields above</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center mb-4">
                          {gmailStatus.isConfigured ? (
                            <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
                          ) : (
                            <XCircleIcon className="h-6 w-6 text-red-500 mr-3" />
                          )}
                          <div>
                            <h4 className="text-base font-medium text-gray-900">
                              Gmail Integration Status
                            </h4>
                            <p className="text-sm text-gray-600">
                              {gmailStatus.isConfigured 
                                ? `Connected as ${gmailStatus.credentials?.email}` 
                                : 'Not configured'}
                            </p>
                          </div>
                        </div>

                        {(!settings.google_client_id || !settings.google_client_secret) && (
                          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <div className="flex">
                              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" />
                              <div className="text-sm text-yellow-800">
                                <p><strong>Configuration Required:</strong> Please configure your Google Client ID and Secret above before connecting Gmail.</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {gmailStatus.isConfigured && (
                          <div className="mb-4 text-sm text-gray-600">
                            <p><strong>Account:</strong> {gmailStatus.credentials?.email}</p>
                            <p><strong>Connected:</strong> {new Date(gmailStatus.credentials?.created_at).toLocaleDateString()}</p>
                            <p><strong>Status:</strong> 
                              <span className={`ml-1 ${gmailStatus.isEnabled ? 'text-green-600' : 'text-red-600'}`}>
                                {gmailStatus.isEnabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </p>
                          </div>
                        )}

                        <div className="flex space-x-3">
                          {!gmailStatus.isConfigured ? (
                            <button
                              onClick={initiateGmailAuth}
                              disabled={gmailLoading || !settings.google_client_id || !settings.google_client_secret}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {gmailLoading ? 'Connecting...' : 'Connect Gmail Account'}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => updateSetting('gmail_integration_enabled', gmailStatus.isEnabled ? 'false' : 'true')}
                                disabled={gmailLoading}
                                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                                  gmailStatus.isEnabled 
                                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                    : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                }`}
                              >
                                {gmailStatus.isEnabled ? 'Disable' : 'Enable'} Integration
                              </button>
                              
                              <button
                                onClick={disconnectGmail}
                                disabled={gmailLoading}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                              >
                                Disconnect Account
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Templates Tab */}
                {activeSettingsTab === 'templates' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Email Templates</h3>
                      <button
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Create Template
                      </button>
                    </div>

                    {templatesLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">Loading templates...</p>
                      </div>
                    ) : (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                          {emailTemplates.map((template) => (
                            <li key={template.id}>
                              <div className="px-4 py-4 flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-3">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {template.name}
                                      </p>
                                      <p className="text-sm text-gray-500 truncate">
                                        {template.subject}
                                      </p>
                                      <div className="mt-1 flex items-center space-x-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          template.template_type === 'event' ? 'bg-blue-100 text-blue-800' :
                                          template.template_type === 'task' ? 'bg-green-100 text-green-800' :
                                          template.template_type === 'notification' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {template.template_type}
                                        </span>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          template.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                          {template.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                                    Edit
                                  </button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Email Logs Tab */}
                {activeSettingsTab === 'logs' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Email Logs</h3>
                      <div className="flex items-center space-x-2">
                        <select
                          value={logFilters.status}
                          onChange={(e) => setLogFilters(prev => ({ ...prev, status: e.target.value, offset: 0 }))}
                          className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="all">All Status</option>
                          <option value="sent">Sent</option>
                          <option value="pending">Pending</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                    </div>

                    {logsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">Loading logs...</p>
                      </div>
                    ) : (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                          {emailLogs.map((log) => (
                            <li key={log.id}>
                              <div className="px-4 py-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {log.subject}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">
                                      To: {log.to_emails.join(', ')}
                                    </p>
                                    <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                                      <span>{new Date(log.created_at).toLocaleString()}</span>
                                      {log.template_name && <span>• Template: {log.template_name}</span>}
                                      {log.sent_by_first_name && (
                                        <span>• Sent by: {log.sent_by_first_name} {log.sent_by_last_name}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      log.status === 'sent' ? 'bg-green-100 text-green-800' :
                                      log.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      log.status === 'failed' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {log.status}
                                    </span>
                                  </div>
                                </div>
                                {log.status === 'failed' && log.error_message && (
                                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-xs text-red-800">{log.error_message}</p>
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="card">
            <div className="text-center py-12">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Reports & Analytics</h3>
              <p className="text-gray-600">Analytics and reporting features coming soon.</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <UserGroupIcon className="h-8 w-8 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900 ml-3">User Management</h3>
                </div>
                <p className="text-gray-600 mb-4">Manage user roles, permissions, and account status</p>
                <button 
                  className="btn-primary w-full"
                  onClick={() => setActiveSection('users')}
                >
                  Manage Users
                </button>
              </div>
              
              <div className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <CogIcon className="h-8 w-8 text-green-600" />
                  <h3 className="text-lg font-medium text-gray-900 ml-3">System Settings</h3>
                </div>
                <p className="text-gray-600 mb-4">Configure system-wide settings and preferences</p>
                <button 
                  className="btn-secondary w-full"
                  onClick={() => setActiveSection('settings')}
                >
                  Settings
                </button>
              </div>
              
              <div className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <ChartBarIcon className="h-8 w-8 text-purple-600" />
                  <h3 className="text-lg font-medium text-gray-900 ml-3">Reports</h3>
                </div>
                <p className="text-gray-600 mb-4">View system analytics, usage reports, and insights</p>
                <button 
                  className="btn-secondary w-full"
                  onClick={() => setActiveSection('reports')}
                >
                  View Reports
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Users</span>
                    <span className="font-medium text-gray-900">Loading...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Events</span>
                    <span className="font-medium text-gray-900">Loading...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending Tasks</span>
                    <span className="font-medium text-gray-900">Loading...</span>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <p className="text-gray-600 text-sm">Activity tracking coming soon...</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation breadcrumb */}
      {activeSection !== 'dashboard' && (
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={() => setActiveSection('dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Admin Dashboard
          </button>
        </div>
      )}
      
      {/* Main content */}
      {renderContent()}
    </div>
  );
};

export default AdminPage;