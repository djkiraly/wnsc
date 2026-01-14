import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Plus, Quote, Star, Edit } from 'lucide-react';
import DeleteButton from './DeleteButton';

export default async function TestimonialsPage() {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Testimonials</h1>
          <p className="text-gray-600 mt-1">{testimonials.length} total testimonials</p>
        </div>
        <Link href="/admin/website/testimonials/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Testimonial
        </Link>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testimonials.length > 0 ? (
          testimonials.map((testimonial) => (
            <div key={testimonial.id} className="card">
              <div className="card-body">
                <div className="flex items-start gap-4">
                  {testimonial.photoUrl ? (
                    <img
                      src={testimonial.photoUrl}
                      alt={testimonial.personName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Quote className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {testimonial.rating && (
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < testimonial.rating!
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm line-clamp-3 mb-3">
                      &quot;{testimonial.quote}&quot;
                    </p>
                    <div>
                      <p className="font-medium text-gray-900">{testimonial.personName}</p>
                      <p className="text-sm text-gray-500">
                        {[testimonial.personTitle, testimonial.organization]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      {testimonial.eventName && (
                        <p className="text-xs text-primary mt-1">{testimonial.eventName}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    {testimonial.isActive ? (
                      <span className="badge badge-accent">Active</span>
                    ) : (
                      <span className="badge badge-gray">Inactive</span>
                    )}
                    {testimonial.isFeatured && (
                      <span className="badge badge-secondary">Featured</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/website/testimonials/${testimonial.id}/edit`}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <DeleteButton id={testimonial.id} name={testimonial.personName} />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 card">
            <div className="card-body py-12 text-center text-gray-500">
              No testimonials found. Add your first testimonial to get started.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
