import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import UserForm from '../UserForm';

export default async function NewUserPage() {
  const user = await getCurrentUser();

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    redirect('/admin/dashboard');
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New User</h1>
        <p className="text-gray-600 mt-1">Create a new team member account</p>
      </div>

      <UserForm currentUserRole={user.role} />
    </div>
  );
}
