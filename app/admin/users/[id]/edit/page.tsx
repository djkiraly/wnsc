import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import UserForm from '../../UserForm';

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
    redirect('/admin/dashboard');
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      memberStatus: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      bio: true,
      active: true,
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
        <p className="text-gray-600 mt-1">Update {user.name}&apos;s profile</p>
      </div>

      <UserForm user={user} currentUserRole={currentUser.role} />
    </div>
  );
}
