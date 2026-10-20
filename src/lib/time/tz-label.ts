/**
 * Fuseaux affichés aux clientes (SPEC §1.4) : par défaut Paris en français, Mexico en espagnol,
 * libellé lisible (« heure de Paris », « hora de Ciudad de México », sinon le nom de la ville).
 */

export type UiLocale = 'fr' | 'es' | 'en';

export function defaultTimeZoneForLocale(locale: string | null | undefined): string {
  return locale === 'es' ? 'America/Mexico_City' : 'Europe/Paris';
}

/** Fuseau valide (sinon le défaut de la langue). */
export function resolveDisplayTimeZone(tz: string | null | undefined, locale: string | null | undefined): string {
  const candidate = (tz ?? '').trim();
  if (candidate) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: candidate });
      return candidate;
    } catch {
      /* fuseau inconnu : défaut */
    }
  }
  return defaultTimeZoneForLocale(locale);
}

/** « heure de Paris » / « hora de Ciudad de México » / « time in Paris » (minuscule en tête). */
export function tzLabel(tz: string, locale: UiLocale): string {
  if (tz === 'Europe/Paris') return locale === 'es' ? 'hora de París' : locale === 'en' ? 'Paris time' : 'heure de Paris';
  if (tz === 'America/Mexico_City') {
    return locale === 'es' ? 'hora de Ciudad de México' : locale === 'en' ? 'Mexico City time' : 'heure de Mexico';
  }
  const city = tz.split('/').pop()?.replace(/_/g, ' ') ?? tz;
  return locale === 'es' ? `hora de ${city}` : locale === 'en' ? `${city} time` : `heure de ${city}`;
}

/** « Heures de Paris » / « Hora de Ciudad de México » / « Times: Paris time » : en-tête d'un planning. */
export function tzHoursLabel(tz: string, locale: UiLocale): string {
  const label = tzLabel(tz, locale);
  if (locale === 'fr') return `Heures ${label.replace(/^heure /, '')}`;
  if (locale === 'es') return label.charAt(0).toUpperCase() + label.slice(1);
  return `Times: ${label}`;
}
