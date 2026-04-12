import type { Course } from '@/types';

/** Clé d’environnement Stripe Price ID par identifiant produit (types.ts). */
export const COURSE_STRIPE_PRICE_ENV: Record<string, string> = {
  'v-coll': 'STRIPE_PRICE_ID_VISIO_COLLECTIF',
  'v-ind': 'STRIPE_PRICE_ID_VISIO_INDIVIDUEL',
  'n-coll': 'STRIPE_PRICE_ID_NANTES_COLLECTIF',
  'n-ind': 'STRIPE_PRICE_ID_NANTES_INDIVIDUEL',
};

/** Mode Checkout dérivé côté serveur (ne jamais faire confiance au client). */
export const COURSE_CHECKOUT_MODE: Record<string, 'subscription' | 'payment'> = {
  'v-coll': 'subscription',
  'v-ind': 'subscription',
  'n-coll': 'payment',
  'n-ind': 'payment',
};

export function getStripePriceId(courseId: string): string | undefined {
  const envKey = COURSE_STRIPE_PRICE_ENV[courseId];
  if (!envKey) return undefined;
  return process.env[envKey];
}

export function isValidCheckoutCourseId(courseId: string): boolean {
  return Object.prototype.hasOwnProperty.call(COURSE_STRIPE_PRICE_ENV, courseId);
}

export function getCheckoutMode(course: Course): 'subscription' | 'payment' {
  return course.isUnitPay ? 'payment' : 'subscription';
}
