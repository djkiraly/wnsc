import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

function GmailCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Processing authorization...');

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('Authorization was denied or failed');
        toast.error('Gmail authorization failed');
        setTimeout(() => {
          window.close();
        }, 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received');
        toast.error('Gmail authorization failed');
        setTimeout(() => {
          window.close();
        }, 3000);
        return;
      }

      try {
        // Send the authorization code to the backend
        const response = await axios.post('/api/settings/gmail/callback', { code });
        
        if (response.data.success) {
          setStatus('success');
          setMessage(`Gmail integration configured successfully for ${response.data.email}`);
          toast.success('Gmail integration configured successfully!');
          
          // Close the popup window after a short delay
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          throw new Error(response.data.message || 'Failed to configure Gmail integration');
        }
      } catch (error) {
        console.error('Error processing Gmail callback:', error);
        setStatus('error');
        setMessage(error.response?.data?.message || 'Failed to configure Gmail integration');
        toast.error('Failed to configure Gmail integration');
        
        setTimeout(() => {
          window.close();
        }, 3000);
      }
    };

    processCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Processing Authorization</h2>
            <p className="text-sm text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">Success!</h2>
            <p className="text-sm text-gray-600 mb-4">{message}</p>
            <p className="text-xs text-gray-500">This window will close automatically...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">Authorization Failed</h2>
            <p className="text-sm text-gray-600 mb-4">{message}</p>
            <p className="text-xs text-gray-500">This window will close automatically...</p>
            <button
              onClick={() => window.close()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default GmailCallback;