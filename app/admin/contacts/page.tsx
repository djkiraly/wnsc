import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Mail, Phone, Building, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import ContactStatusSelect from './ContactStatusSelect';

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status;

  const contacts = await prisma.contact.findMany({
    where: {
      ...(status && status !== 'all' ? { status: status as any } : {}),
    },
    include: {
      assignedTo: {
        select: { name: true },
      },
      event: {
        select: { title: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const statusCounts = await prisma.contact.groupBy({
    by: ['status'],
    _count: true,
  });

  const getCount = (s: string) => statusCounts.find(c => c.status === s)?._count || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">{contacts.length} contact requests</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6">
        <Link
          href="/admin/contacts"
          className={`btn ${!status || status === 'all' ? 'btn-primary' : 'btn-outline'}`}
        >
          All ({contacts.length})
        </Link>
        <Link
          href="/admin/contacts?status=NEW"
          className={`btn ${status === 'NEW' ? 'btn-primary' : 'btn-outline'}`}
        >
          New ({getCount('NEW')})
        </Link>
        <Link
          href="/admin/contacts?status=IN_PROGRESS"
          className={`btn ${status === 'IN_PROGRESS' ? 'btn-primary' : 'btn-outline'}`}
        >
          In Progress ({getCount('IN_PROGRESS')})
        </Link>
        <Link
          href="/admin/contacts?status=RESOLVED"
          className={`btn ${status === 'RESOLVED' ? 'btn-primary' : 'btn-outline'}`}
        >
          Resolved ({getCount('RESOLVED')})
        </Link>
        <Link
          href="/admin/contacts?status=ARCHIVED"
          className={`btn ${status === 'ARCHIVED' ? 'btn-primary' : 'btn-outline'}`}
        >
          Archived ({getCount('ARCHIVED')})
        </Link>
      </div>

      {/* Contacts List */}
      <div className="space-y-4">
        {contacts.length > 0 ? (
          contacts.map((contact) => (
            <div key={contact.id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{contact.name}</h3>
                      <span className={`badge ${
                        contact.status === 'NEW' ? 'badge-primary' :
                        contact.status === 'IN_PROGRESS' ? 'badge-secondary' :
                        contact.status === 'RESOLVED' ? 'badge-accent' :
                        'badge-gray'
                      }`}>
                        {contact.status.replace('_', ' ')}
                      </span>
                      <span className="badge badge-gray">
                        {contact.inquiryType.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${contact.email}`} className="hover:text-primary">
                          {contact.email}
                        </a>
                      </div>
                      {contact.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${contact.phone}`} className="hover:text-primary">
                            {contact.phone}
                          </a>
                        </div>
                      )}
                      {contact.organization && (
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {contact.organization}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(contact.createdAt)}
                      </div>
                    </div>

                    <p className="text-gray-700 whitespace-pre-wrap">{contact.message}</p>

                    {contact.event && (
                      <p className="text-sm text-gray-500 mt-2">
                        Related to: <span className="font-medium">{contact.event.title}</span>
                      </p>
                    )}
                  </div>

                  <div className="ml-4">
                    <ContactStatusSelect
                      contactId={contact.id}
                      currentStatus={contact.status}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card">
            <div className="card-body text-center py-12 text-gray-500">
              No contacts found
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
