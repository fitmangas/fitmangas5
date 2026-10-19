import { isOnlineCustomerTier, type CustomerTier } from '@/lib/access-control';

export type LiveLanguage = 'fr' | 'es';

export type RecipientProfile = {
  id: string;
  preferred_locale: string | null;
  live_other_language?: boolean | null;
  customer_tier?: string | null;
  subscription_status?: string | null;
  display_timezone?: string | null;
  /** Accès visio déjà calculé (fonction actuelle). */
  visioAccess: boolean;
};

export function profileLocale(p: Pick<RecipientProfile, 'preferred_locale'>): LiveLanguage {
  return p.preferred_locale === 'es' ? 'es' : 'fr';
}

/**
 * Destinataires d’un live visio (SPEC §3.1) :
 * accès Visio actif (fonction actuelle) ET (langue du live OU live_other_language).
 * Accès expiré → exclu.
 */
export function isVisioLiveRecipient(profile: RecipientProfile, liveLanguage: LiveLanguage): boolean {
  if (!profile.visioAccess) return false;
  if (profileLocale(profile) === liveLanguage) return true;
  return profile.live_other_language === true;
}

export function visioAccessFromTier(tier: CustomerTier | null | undefined, expired: boolean): boolean {
  if (expired) return false;
  return isOnlineCustomerTier(tier ?? null);
}

export type TwinCourse = { id: string; language: LiveLanguage; startsAtIso: string };

/** Deux lives à la même heure (≤ 20 min) de langues différentes = jumeaux. */
export function findTwin(
  course: TwinCourse,
  others: TwinCourse[],
): TwinCourse | null {
  const t = Date.parse(course.startsAtIso);
  return (
    others.find((o) => {
      if (o.id === course.id) return false;
      if (o.language === course.language) return false;
      return Math.abs(Date.parse(o.startsAtIso) - t) <= 20 * 60 * 1000;
    }) ?? null
  );
}

/**
 * Si un jumeau existe : sans « autre langue », on n’envoie que le live de sa locale.
 * Avec live_other_language, les deux.
 */
export function shouldNotifyForTwinSlot(
  profile: RecipientProfile,
  course: TwinCourse,
  twin: TwinCourse | null,
): boolean {
  if (!isVisioLiveRecipient(profile, course.language)) return false;
  if (!twin) return true;
  if (profile.live_other_language) return true;
  return profileLocale(profile) === course.language;
}

export function contentGroupKey(now: Date, timeZone: string): string {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return `content-${day}`;
}

export function replayLanguageAllowed(
  replayLiveLanguage: LiveLanguage | null | undefined,
  profile: RecipientProfile,
): boolean {
  if (!replayLiveLanguage) return true;
  if (profileLocale(profile) === replayLiveLanguage) return true;
  return profile.live_other_language === true;
}
