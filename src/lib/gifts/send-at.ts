export const TIME_SHORTCUTS = [
  { id: 'matin', label: 'Le matin · 8:00', labelEs: 'Por la mañana · 8:00', time: '08:00' },
  { id: 'midi', label: 'Le midi · 12:00', labelEs: 'Al mediodía · 12:00', time: '12:00' },
  { id: 'aprem', label: 'L’après-midi · 14:00', labelEs: 'Por la tarde · 14:00', time: '14:00' },
  { id: 'soir', label: 'Le soir · 19:00', labelEs: 'Por la noche · 19:00', time: '19:00' },
] as const;

export const DEFAULT_SEND_TIME = '08:00';
export const ALLOWED_TIMEZONES = ['Europe/Paris', 'America/Mexico_City'] as const;
export type GiftTimezone = (typeof ALLOWED_TIMEZONES)[number];

export function halfHourSlots(): string[] {
  const out: string[] = [];
  for (let h = 7; h <= 22; h += 1) {
    out.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 22) out.push(`${String(h).padStart(2, '0')}:30`);
  }
  return out;
}

export function normalizeGiftTimezone(raw: string | null | undefined): GiftTimezone {
  if (raw === 'America/Mexico_City') return 'America/Mexico_City';
  return 'Europe/Paris';
}

function partsInZone(utcMs: number, timeZone: string) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const bag: Record<string, string> = {};
  for (const p of fmt.formatToParts(new Date(utcMs))) {
    if (p.type !== 'literal') bag[p.type] = p.value;
  }
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: Number(bag.hour === '24' ? '0' : bag.hour),
    minute: Number(bag.minute),
  };
}

/** Date locale (YYYY-MM-DD) + heure (HH:MM) + fuseau IANA → instant UTC. Gère le changement d’heure. */
export function computeSendAtUtc(dateYmd: string, timeHm: string, timeZone: string): Date {
  const [year, month, day] = dateYmd.split('-').map(Number);
  const [hour, minute] = timeHm.split(':').map(Number);
  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error('date/heure invalides');
  }
  let utc = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 3; i += 1) {
    const loc = partsInZone(utc, timeZone);
    const delta =
      Date.UTC(year, month - 1, day, hour, minute) - Date.UTC(loc.year, loc.month - 1, loc.day, loc.hour, loc.minute);
    utc += delta;
    if (delta === 0) break;
  }
  return new Date(utc);
}

/** Date du jour (YYYY-MM-DD) dans un fuseau, décalée de `addDays` jours. */
export function ymdInZone(at: Date, timeZone: string, addDays = 0): string {
  const p = partsInZone(at.getTime() + addDays * 86_400_000, timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** Fuseau d'envoi déduit du navigateur : Mexico pour les Amériques, Paris sinon. */
export function guessGiftTimezone(browserTz: string | null | undefined): GiftTimezone {
  return browserTz && browserTz.startsWith('America/') ? 'America/Mexico_City' : 'Europe/Paris';
}

export function maxSendDateYmd(purchasedAt: Date): string {
  const d = new Date(purchasedAt);
  d.setUTCMonth(d.getUTCMonth() + 6);
  return d.toISOString().slice(0, 10);
}

export function formatSendRecap(dateYmd: string, timeHm: string, locale: 'fr' | 'es' = 'fr'): string {
  const [y, m, d] = dateYmd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const weekday = new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).format(dt);
  return `${weekday} · ${timeHm}`;
}
