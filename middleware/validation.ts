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
