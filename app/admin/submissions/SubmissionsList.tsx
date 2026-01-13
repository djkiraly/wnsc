'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Calendar,
  MapPin,
  User,
  Mail,
  Building,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Submission {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  location: string;
  venueName: string | null;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string | null;
  organization: string | null;
  expectedAttendees: string | null;
  additionalNotes: string | null;
  status: string;
  reviewNotes: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SubmissionsListProps {
  submissions: Submission[];
  counts: {
    all: number;
    PENDING: number;
    UNDER_REVIEW: number;
    APPROVED: number;
    REJECTED: number;
  };
}

type StatusConfigValue = { label: string; color: string; icon: React.ElementType };

const statusConfig: Record<string, StatusConfigValue> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-blue-100 text-blue-800', icon: Eye },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const defaultConfig: StatusConfigValue = { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock };

const getStatusConfig = (status: string): StatusConfigValue => {
  return statusConfig[status] ?? defaultConfig;
};

export default function SubmissionsList({ submissions, counts }: SubmissionsListProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter submissions
  const filteredSubmissions = submissions.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(query) ||
        s.submitterName.toLowerCase().includes(query) ||
        s.submitterEmail.toLowerCase().includes(query) ||
        s.organization?.toLowerCase().includes(query) ||
        s.location.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const updateStatus = async (id: string, status: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/event-submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        router.refresh();
        setSelectedSubmission(null);
      } else {
        alert('Failed to update submission');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const convertToEvent = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/event-submissions/${id}/convert`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        alert('Submission converted to event successfully!');
        router.push(`/admin/events/${data.event.id}/edit`);
      } else {
        alert(data.error || 'Failed to convert submission');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(['all', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] as const).map((status) => {
          const count = status === 'all' ? counts.all : counts[status];
          const config = status !== 'all' ? statusConfig[status] : null;
          const Icon = config?.icon || Clock;

          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'card p-4 text-center transition-all',
                statusFilter === status ? 'ring-2 ring-primary' : ''
              )}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                {config && <Icon className="h-4 w-4" />}
                <span className="text-2xl font-bold text-gray-900">{count}</span>
              </div>
              <div className="text-sm text-gray-500 capitalize">
                {status === 'all' ? 'All' : config?.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search submissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Submissions List */}
      <div className="card">
        <div className="divide-y divide-gray-200">
          {filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No submissions found</p>
            </div>
          ) : (
            filteredSubmissions.map((submission) => {
              const config = getStatusConfig(submission.status);
              const StatusIcon = config.icon;

              return (
                <div
                  key={submission.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {submission.title}
                        </h3>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                            config.color
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {submission.submitterName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(submission.startDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {submission.location}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      Submitted {formatDateTime(submission.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedSubmission(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedSubmission.title}
                  </h2>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium mt-2',
                      getStatusConfig(selectedSubmission.status).color
                    )}
                  >
                    {getStatusConfig(selectedSubmission.status).label}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Event Details */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Event Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <span className="text-xs text-gray-500">Category</span>
                      <p className="font-medium">{selectedSubmission.category}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Description</span>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedSubmission.description}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-gray-500">Start</span>
                        <p className="font-medium">{formatDateTime(selectedSubmission.startDate)}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">End</span>
                        <p className="font-medium">{formatDateTime(selectedSubmission.endDate)}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Location</span>
                      <p className="font-medium">{selectedSubmission.location}</p>
                      {selectedSubmission.venueName && (
                        <p className="text-sm text-gray-600">{selectedSubmission.venueName}</p>
                      )}
                    </div>
                    {selectedSubmission.expectedAttendees && (
                      <div>
                        <span className="text-xs text-gray-500">Expected Attendees</span>
                        <p className="font-medium">{selectedSubmission.expectedAttendees}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submitter Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Submitter Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{selectedSubmission.submitterName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a
                        href={`mailto:${selectedSubmission.submitterEmail}`}
                        className="text-primary hover:underline"
                      >
                        {selectedSubmission.submitterEmail}
                      </a>
                    </div>
                    {selectedSubmission.submitterPhone && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Phone:</span>
                        <span>{selectedSubmission.submitterPhone}</span>
                      </div>
                    )}
                    {selectedSubmission.organization && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span>{selectedSubmission.organization}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Notes */}
                {selectedSubmission.additionalNotes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Additional Notes</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedSubmission.additionalNotes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Review Notes */}
                {selectedSubmission.reviewNotes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Review Notes</h3>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedSubmission.reviewNotes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedSubmission.status === 'PENDING' && (
                      <button
                        onClick={() => updateStatus(selectedSubmission.id, 'UNDER_REVIEW')}
                        disabled={loading}
                        className="btn btn-secondary"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4 mr-2" />
                        )}
                        Mark Under Review
                      </button>
                    )}

                    {(selectedSubmission.status === 'PENDING' ||
                      selectedSubmission.status === 'UNDER_REVIEW') && (
                      <>
                        <button
                          onClick={() => updateStatus(selectedSubmission.id, 'APPROVED')}
                          disabled={loading}
                          className="btn bg-green-600 text-white hover:bg-green-700"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => updateStatus(selectedSubmission.id, 'REJECTED')}
                          disabled={loading}
                          className="btn bg-red-600 text-white hover:bg-red-700"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                          )}
                          Reject
                        </button>
                      </>
                    )}

                    {selectedSubmission.status === 'APPROVED' && (
                      <button
                        onClick={() => convertToEvent(selectedSubmission.id)}
                        disabled={loading}
                        className="btn btn-primary"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4 mr-2" />
                        )}
                        Convert to Event
                      </button>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="border-t pt-4 text-xs text-gray-400">
                  <p>Submitted: {formatDateTime(selectedSubmission.createdAt)}</p>
                  {selectedSubmission.reviewedAt && (
                    <p>Reviewed: {formatDateTime(selectedSubmission.reviewedAt)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
