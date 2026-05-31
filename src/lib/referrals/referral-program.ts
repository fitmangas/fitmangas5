import { COURSE_CUSTOMER_TIER } from '@/lib/checkout-courses';

/** Programme de récompense parrainage selon l’abonnement de la parraine. */
export type ReferralProgramKind = 'visio_collectif' | 'visio_individuel' | 'presentiel' | 'none';

const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing'] as const;

/** Types `profiles.subscription_type` + tiers Stripe acceptés pour une filleule (parraine v-coll). */
export const V_COLL_REFERRED_SUBSCRIPTION_TYPES = [
  'v-coll',
  'v-ind',
  'visio_collectif',
  'visio_individuel',
  'online_group_monthly',
  'online_individual_monthly',
] as const;

/** Types acceptés pour une filleule (parraine v-ind uniquement). */
export const V_IND_REFERRED_SUBSCRIPTION_TYPES = [
  'v-ind',
  'visio_individuel',
  'online_individual_monthly',
] as const;

const V_COLL_REFERRED_COURSE_IDS = ['v-coll', 'v-ind'] as const;
const V_IND_REFERRED_COURSE_IDS = ['v-ind'] as const;
const PRESENTIEL_COURSE_IDS = ['n-coll', 'n-ind'] as const;

export type ReferrerProfileSlice = {
  subscription_type?: string | null;
  last_checkout_course_id?: string | null;
  subscription_status?: string | null;
};

function norm(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

/** Détermine le programme parrainage de la parraine à partir de son profil. */
export function resolveReferrerReferralProgram(profile: ReferrerProfileSlice): ReferralProgramKind {
  const course = norm(profile.last_checkout_course_id);
  const type = norm(profile.subscription_type);

  if (
    PRESENTIEL_COURSE_IDS.includes(course as (typeof PRESENTIEL_COURSE_IDS)[number]) ||
    type.includes('presentiel') ||
    type.startsWith('onsite_')
  ) {
    return 'presentiel';
  }

  if (
    course === 'v-ind' ||
    type === 'v-ind' ||
    type === 'visio_individuel' ||
    type === 'online_individual_monthly'
  ) {
    return 'visio_individuel';
  }

  if (
    course === 'v-coll' ||
    type === 'v-coll' ||
    type === 'visio_collectif' ||
    type === 'online_group_monthly'
  ) {
    return 'visio_collectif';
  }

  return 'none';
}

export function isReferralRewardProgram(program: ReferralProgramKind): program is 'visio_collectif' | 'visio_individuel' {
  return program === 'visio_collectif' || program === 'visio_individuel';
}

export function referredSubscriptionTypesForProgram(program: ReferralProgramKind): readonly string[] | null {
  if (program === 'visio_collectif') return V_COLL_REFERRED_SUBSCRIPTION_TYPES;
  if (program === 'visio_individuel') return V_IND_REFERRED_SUBSCRIPTION_TYPES;
  return null;
}

export function referredCourseIdsForProgram(program: ReferralProgramKind): readonly string[] | null {
  if (program === 'visio_collectif') return V_COLL_REFERRED_COURSE_IDS;
  if (program === 'visio_individuel') return V_IND_REFERRED_COURSE_IDS;
  return null;
}

export type ReferredProfileSlice = {
  subscription_type?: string | null;
  last_checkout_course_id?: string | null;
  subscription_status?: string | null;
};

/** Une filleule compte pour la parraine si son abonnement actif correspond au programme. */
export function referredProfileQualifies(program: ReferralProgramKind, profile: ReferredProfileSlice): boolean {
  if (!isReferralRewardProgram(program)) return false;

  const status = norm(profile.subscription_status);
  if (!ACTIVE_SUBSCRIPTION_STATUSES.includes(status as (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number])) {
    return false;
  }

  const type = norm(profile.subscription_type);
  const course = norm(profile.last_checkout_course_id);
  const types = referredSubscriptionTypesForProgram(program) ?? [];
  const courses = referredCourseIdsForProgram(program) ?? [];

  if (type && types.includes(type)) return true;
  if (course && courses.includes(course as (typeof courses)[number])) return true;

  return false;
}

/** Tier Stripe `subscriptions.tier` pour appliquer la remise 100 % à la parraine. */
export function stripeTierForReferrerProgram(program: ReferralProgramKind): string | null {
  if (program === 'visio_collectif') return COURSE_CUSTOMER_TIER['v-coll'];
  if (program === 'visio_individuel') return COURSE_CUSTOMER_TIER['v-ind'];
  return null;
}

/** Course id principal de la parraine (affichage / marquage checkout). */
export function primaryCourseIdForProgram(program: ReferralProgramKind): string | null {
  if (program === 'visio_collectif') return 'v-coll';
  if (program === 'visio_individuel') return 'v-ind';
  return null;
}

/** Le checkout filleule déclenche un marquage « subscribed » pour la parraine. */
export function referredCheckoutQualifiesForProgram(program: ReferralProgramKind, courseId: string | null | undefined): boolean {
  if (!isReferralRewardProgram(program) || !courseId) return false;
  const courses = referredCourseIdsForProgram(program);
  return courses?.includes(courseId as (typeof courses)[number]) ?? false;
}
