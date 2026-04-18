import type { AccessType, CourseCategory, CourseFormat, CustomerTier } from '@/lib/domain/calendar-types';

export type AppUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'member' | 'admin';
  subscriptionType: CustomerTier | null;
};

export type CourseModel = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  format: CourseFormat;
  category: CourseCategory;
  startsAt: string;
  endsAt: string;
  timezone: string;
  capacityMax: number | null;
  location: string | null;
  liveUrl: string | null;
  replayUrl: string | null;
};

export type AccessModel = {
  userId: string;
  courseId: string;
  accessLevel: AccessType;
  canPurchaseSingle: boolean;
  upsellTier: CustomerTier | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
};

export type SubscriptionModel = {
  id: string;
  userId: string;
  tier: CustomerTier;
  status: 'active' | 'past_due' | 'canceled' | 'paused' | 'trialing';
  startsAt: string;
  endsAt: string | null;
  priceCents: number;
  currency: string;
  interval: 'month' | 'year';
  autoRenews: boolean;
};

export type EnrollmentModel = {
  id: string;
  userId: string;
  courseId: string;
  status: 'booked' | 'attended' | 'canceled' | 'waitlist';
  purchasedAt: string;
  priceCents: number;
  currency: string;
};
