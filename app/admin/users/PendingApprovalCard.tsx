'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, CheckCircle, XCircle, Loader2, User, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface PendingApprovalCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
  };
}

export default function PendingApprovalCard({ user }: PendingApprovalCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async () => {
    setLoading('approve');
    try {
      const response = await fetch(`/api/users/${user.id}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to approve user');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    setLoading('reject');
    try {
      const response = await fetch(`/api/users/${user.id}/approve`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (response.ok) {
        setShowRejectModal(false);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reject user');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="card p-4 border-amber-200 bg-amber-50/50">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center font-semibold flex-shrink-0">
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

        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={loading !== null}
            className="flex-1 btn bg-green-600 text-white hover:bg-green-700 text-sm py-2"
          >
            {loading === 'approve' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </>
            )}
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={loading !== null}
            className="flex-1 btn bg-red-600 text-white hover:bg-red-700 text-sm py-2"
          >
            {loading === 'reject' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </>
            )}
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowRejectModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Reject Registration
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Are you sure you want to reject the registration for{' '}
                <strong>{user.name}</strong>?
              </p>

              <div className="mb-4">
                <label htmlFor="rejectReason" className="label">
                  Reason (optional)
                </label>
                <textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="textarea"
                  rows={3}
                  placeholder="Provide a reason for rejection (will be sent to the user)"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="btn btn-secondary"
                  disabled={loading !== null}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="btn bg-red-600 text-white hover:bg-red-700"
                  disabled={loading !== null}
                >
                  {loading === 'reject' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject User
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
