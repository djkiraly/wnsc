import { User, Event, Contact, Task, Note, Role, EventStatus, ContactStatus, InquiryType, TaskStatus, Priority } from '@prisma/client';

// Re-export Prisma types
export type {
  User,
  Event,
  Contact,
  Task,
  Note,
  Role,
  EventStatus,
  ContactStatus,
  InquiryType,
  TaskStatus,
  Priority,
};

// Extended types
export interface EventWithRelations extends Event {
  createdBy: Pick<User, 'id' | 'name' | 'email'>;
  _count?: {
    tasks: number;
    contacts: number;
    notes: number;
  };
}

export interface ContactWithRelations extends Contact {
  assignedTo?: Pick<User, 'id' | 'name' | 'email'> | null;
  event?: Pick<Event, 'id' | 'title'> | null;
}

export interface TaskWithRelations extends Task {
  assignedTo?: Pick<User, 'id' | 'name' | 'email'> | null;
  createdBy: Pick<User, 'id' | 'name' | 'email'>;
  event?: Pick<Event, 'id' | 'title'> | null;
}

export interface NoteWithRelations extends Note {
  author: Pick<User, 'id' | 'name'>;
  event?: Pick<Event, 'id' | 'title'> | null;
  contact?: Pick<Contact, 'id' | 'name'> | null;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Analytics types
export interface AnalyticsData {
  pageViews: {
    total: number;
    trend: Array<{ date: string; count: number }>;
    topPages: Array<{ page: string; count: number }>;
  };
  eventViews: {
    total: number;
    topEvents: Array<{ eventId: string; title: string; count: number }>;
  };
  contacts: {
    total: number;
    byType: Array<{ type: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
  };
  devices: Array<{ type: string; count: number }>;
  browsers: Array<{ name: string; count: number }>;
}

// Dashboard stats
export interface DashboardStats {
  activeEvents: number;
  pendingContacts: number;
  monthlyPageViews: number;
  upcomingDeadlines: number;
}

// Form data types
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  inquiryType: InquiryType;
  message: string;
  recaptchaToken: string;
}

export interface EventFormData {
  title: string;
  description: string;
  category: string;
  startDate: Date | string;
  endDate: Date | string;
  location: string;
  venueName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  featuredImage?: string;
  registrationUrl?: string;
  status: EventStatus;
  metaDescription?: string;
  keywords?: string;
  published: boolean;
}

export interface TaskFormData {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: Date | string;
  assignedToId?: string;
  eventId?: string;
  checklist?: any;
}

export interface UserFormData {
  email: string;
  name: string;
  role: Role;
  password?: string;
}

// Settings types
export interface SiteSettings {
  organizationName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  businessHours: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}
