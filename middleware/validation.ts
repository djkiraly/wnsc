import { z } from 'zod';

// Strong password schema for user creation and password updates
const strongPasswordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Contact form validation
export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  organization: z.string().optional(),
  inquiryType: z.enum(['HOSTING_EVENT', 'PARTNERSHIP', 'GENERAL_INQUIRY', 'MEDIA']),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  recaptchaToken: z.string().min(1, 'reCAPTCHA verification required'),
});

// Event validation
export const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(2, 'Category is required'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  location: z.string().min(2, 'Location is required'),
  venueName: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  featuredImage: z.string().optional(),
  registrationUrl: z.string().url().optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED']),
  metaDescription: z.string().max(160).optional(),
  keywords: z.string().optional(),
  published: z.boolean(),
});

// User validation
export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR']),
  password: strongPasswordSchema.optional(),
});

// Login validation
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Task validation
export const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  dueDate: z.string().or(z.date()).optional(),
  assignedToId: z.string().optional(),
  eventId: z.string().optional(),
});

// Newsletter validation
export const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
});

// Password reset validation
export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const passwordUpdateSchema = z.object({
  token: z.string().min(1),
  password: strongPasswordSchema,
});

// Helper function to validate and parse data
export function validateData<T>(schema: z.Schema<T>, data: unknown): { success: boolean; data?: T; errors?: z.ZodError } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    return { success: false };
  }
}

// ===========================================
// CMS Content Validation Schemas
// ===========================================

// Facility validation
export const facilitySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  slug: z.string().min(2, 'Slug is required').max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().max(300).optional(),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  capacity: z.number().int().positive().optional().nullable(),
  amenities: z.array(z.string()).optional().default([]),
  sportTypes: z.array(z.string()).optional().default([]),
  featuredImage: z.string().optional(),
  isPublic: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  mapEmbedUrl: z.string().optional(),
});

// Facility photo validation
export const facilityPhotoSchema = z.object({
  facilityId: z.string().min(1, 'Facility ID is required'),
  url: z.string().url('Invalid URL'),
  caption: z.string().max(200).optional(),
  sortOrder: z.number().int().default(0),
});

// Testimonial validation
export const testimonialSchema = z.object({
  quote: z.string().min(10, 'Quote must be at least 10 characters').max(1000),
  personName: z.string().min(2, 'Person name is required'),
  personTitle: z.string().max(100).optional(),
  organization: z.string().max(100).optional(),
  eventName: z.string().max(200).optional(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  photoUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

// Attraction validation
export const attractionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  slug: z.string().min(2, 'Slug is required').max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['outdoor', 'museum', 'dining', 'entertainment', 'shopping', 'other']),
  address: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

// Accommodation validation
export const accommodationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  slug: z.string().min(2, 'Slug is required').max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  description: z.string().optional(),
  type: z.enum(['hotel', 'motel', 'campground', 'bnb', 'other']),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  bookingUrl: z.string().url().optional().or(z.literal('')),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional().nullable(),
  roomCount: z.number().int().positive().optional().nullable(),
  amenities: z.array(z.string()).optional().default([]),
  imageUrl: z.string().optional(),
  isPartner: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

// Partner validation
export const partnerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  slug: z.string().min(2, 'Slug is required').max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  tier: z.enum(['PRESENTING', 'GOLD', 'SILVER', 'BRONZE', 'COMMUNITY']).default('COMMUNITY'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

// FAQ validation
export const faqSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters').max(500),
  answer: z.string().min(10, 'Answer must be at least 10 characters'),
  category: z.string().default('General'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

// Resource validation
export const resourceSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().optional(),
  fileUrl: z.string().url('File URL is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().min(1, 'File type is required'),
  fileSize: z.number().int().optional().nullable(),
  category: z.string().default('General'),
  isPublic: z.boolean().default(true),
});

// Media validation
export const mediaSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  originalName: z.string().min(1, 'Original file name is required'),
  url: z.string().url('URL is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  fileSize: z.number().int().positive('File size must be positive'),
  folder: z.string().default('uploads'),
  altText: z.string().max(200).optional(),
});

// News validation
export const newsSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  slug: z.string().min(2, 'Slug is required').max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  excerpt: z.string().max(500).optional(),
  featuredImage: z.string().optional(),
  isPublished: z.boolean().default(false),
  publishedAt: z.string().or(z.date()).optional().nullable(),
  metaDescription: z.string().max(160).optional(),
});

// reCAPTCHA verification
export async function verifyRecaptcha(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const data = await response.json();
    return data.success && data.score >= 0.5;
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error);
    return false;
  }
}
