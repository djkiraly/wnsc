import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Plus, Handshake, ExternalLink, Edit } from 'lucide-react';
import DeleteButton from './DeleteButton';

const tierOrder = ['PRESENTING', 'GOLD', 'SILVER', 'BRONZE', 'COMMUNITY'];
const tierColors: Record<string, string> = {
  PRESENTING: 'bg-purple-100 text-purple-800',
  GOLD: 'bg-yellow-100 text-yellow-800',
  SILVER: 'bg-gray-200 text-gray-700',
  BRONZE: 'bg-orange-100 text-orange-800',
  COMMUNITY: 'bg-blue-100 text-blue-800',
};

export default async function PartnersPage() {
  const partners = await prisma.partner.findMany({
    orderBy: [
      { tier: 'asc' },
      { sortOrder: 'asc' },
    ],
  });

  // Group partners by tier
  const groupedPartners = tierOrder.reduce((acc, tier) => {
    acc[tier] = partners.filter((p) => p.tier === tier);
    return acc;
  }, {} as Record<string, typeof partners>);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Partners & Sponsors</h1>
          <p className="text-gray-600 mt-1">{partners.length} total partners</p>
        </div>
        <Link href="/admin/website/partners/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Partner
        </Link>
      </div>

      {/* Partners by Tier */}
      <div className="space-y-8">
        {tierOrder.map((tier) => {
          const tierPartners = groupedPartners[tier] ?? [];
          if (tierPartners.length === 0) return null;

          return (
            <div key={tier} className="card">
              <div className="card-header flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-sm ${tierColors[tier]}`}>
                    {tier}
                  </span>
                  Partners
                </h2>
                <span className="text-sm text-gray-500">{tierPartners.length}</span>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tierPartners.map((partner) => (
                    <div
                      key={partner.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      {partner.logoUrl ? (
                        <img
                          src={partner.logoUrl}
                          alt={partner.name}
                          className="h-12 w-12 object-contain"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                          <Handshake className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{partner.name}</p>
                        {partner.website && (
                          <a
                            href={partner.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            Visit site <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!partner.isActive && (
                          <span className="badge badge-gray text-xs">Inactive</span>
                        )}
                        <Link
                          href={`/admin/website/partners/${partner.id}/edit`}
                          className="p-2 text-gray-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <DeleteButton id={partner.id} name={partner.name} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {partners.length === 0 && (
          <div className="card">
            <div className="card-body py-12 text-center text-gray-500">
              No partners found. Add your first partner to get started.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
