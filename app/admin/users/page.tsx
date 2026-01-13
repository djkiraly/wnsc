import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Plus, Mail, Shield, Users as UsersIcon, Clock, CheckCircle, XCircle, AlertCircle, MailWarning } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import UserActions from './UserActions';
import PendingApprovalCard from './PendingApprovalCard';
import MigrateLegacyUsersButton from './MigrateLegacyUsersButton';
import UnverifiedUserCard from './UnverifiedUserCard';

const memberStatusLabels: Record<string, string> = {
  VISITOR: 'Visitor',
  MEMBER: 'Member',
  VOTING_MEMBER: 'Voting Member',
  PRESIDENT: 'President',
  VICE_PRESIDENT: 'Vice President',
  TREASURER: 'Treasurer',
  SECRETARY: 'Secretary',
};

const memberStatusColors: Record<string, string> = {
  VISITOR: 'bg-gray-100 text-gray-800',
  MEMBER: 'bg-blue-100 text-blue-800',
  VOTING_MEMBER: 'bg-green-100 text-green-800',
  PRESIDENT: 'bg-purple-100 text-purple-800',
  VICE_PRESIDENT: 'bg-indigo-100 text-indigo-800',
  TREASURER: 'bg-amber-100 text-amber-800',
  SECRETARY: 'bg-teal-100 text-teal-800',
};

export default async function UsersPage() {
  const currentUser = await getCurrentUser();

  // Only ADMIN and SUPER_ADMIN can access this page
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
    redirect('/admin/dashboard');
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      memberStatus: true,
      phone: true,
      active: true,
      createdAt: true,
      lastLogin: true,
      emailVerified: true,
      emailVerificationToken: true,
      approved: true,
      approvedAt: true,
    },
  });

  // Separate pending approvals (verified email but not approved)
  const pendingApprovals = users.filter(
    (u) => u.emailVerified && !u.approved
  );

  // Users who registered but haven't verified their email (have verification token)
  const unverifiedUsers = users.filter(
    (u) => !u.emailVerified && u.emailVerificationToken
  );

  // Legacy users (not verified, no verification token - created before registration system)
  const legacyUsers = users.filter(
    (u) => !u.emailVerified && !u.emailVerificationToken && !u.approved
  );

  // Active/approved users for main list
  const activeUsers = users.filter(
    (u) => u.approved || (!u.emailVerified && !u.emailVerificationToken && u.active)
  );

  // Count by member status
  const statusCounts = users.reduce(
    (acc, user) => {
      acc[user.memberStatus] = (acc[user.memberStatus] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">{users.length} team members</p>
        </div>
        <Link href="/admin/users/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Link>
      </div>

      {/* Legacy Users Migration (Super Admin only) */}
      {currentUser.role === 'SUPER_ADMIN' && legacyUsers.length > 0 && (
        <div className="mb-6">
          <MigrateLegacyUsersButton legacyCount={legacyUsers.length} />
        </div>
      )}

      {/* Unverified Email Users */}
      {unverifiedUsers.length > 0 && (
        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <MailWarning className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div>
                <h2 className="font-semibold text-yellow-900">
                  {unverifiedUsers.length} User{unverifiedUsers.length !== 1 ? 's' : ''} Awaiting Email Verification
                </h2>
                <p className="text-sm text-yellow-700">
                  These users registered but haven&apos;t verified their email yet. You can manually verify or resend the verification email.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unverifiedUsers.map((user) => (
              <UnverifiedUserCard key={user.id} user={user} />
            ))}
          </div>
        </div>
      )}

      {/* Pending Approvals Alert */}
      {pendingApprovals.length > 0 && (
        <div className="mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <h2 className="font-semibold text-amber-900">
                  {pendingApprovals.length} Registration{pendingApprovals.length !== 1 ? 's' : ''} Pending Approval
                </h2>
                <p className="text-sm text-amber-700">
                  These users have verified their email and are waiting for admin approval.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingApprovals.map((user) => (
              <PendingApprovalCard key={user.id} user={user} />
            ))}
          </div>
        </div>
      )}

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        {Object.entries(memberStatusLabels).map(([status, label]) => (
          <div key={status} className="card p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {statusCounts[status] || 0}
            </div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  System Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                        {user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-xs text-gray-400">{user.phone}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`badge ${memberStatusColors[user.memberStatus] || 'bg-gray-100 text-gray-800'}`}
                    >
                      <UsersIcon className="h-3 w-3 mr-1" />
                      {memberStatusLabels[user.memberStatus] || user.memberStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Shield
                        className={`h-4 w-4 ${
                          user.role === 'SUPER_ADMIN'
                            ? 'text-red-500'
                            : user.role === 'ADMIN'
                              ? 'text-orange-500'
                              : 'text-gray-400'
                        }`}
                      />
                      <span
                        className={`badge ${
                          user.role === 'SUPER_ADMIN'
                            ? 'bg-red-100 text-red-800'
                            : user.role === 'ADMIN'
                              ? 'bg-orange-100 text-orange-800'
                              : 'badge-gray'
                        }`}
                      >
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`badge ${user.active ? 'badge-accent' : 'bg-red-100 text-red-800'}`}
                      >
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                      {!user.emailVerified && (
                        <span className="badge bg-yellow-100 text-yellow-800 text-xs">
                          Email Unverified
                        </span>
                      )}
                      {user.emailVerified && !user.approved && (
                        <span className="badge bg-amber-100 text-amber-800 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending Approval
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <UserActions
                      user={user}
                      currentUserId={currentUser.id}
                      isSuperAdmin={currentUser.role === 'SUPER_ADMIN'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
