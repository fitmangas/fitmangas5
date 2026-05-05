import { isCriticalEventType } from './category';

/**
 * Prompt §8.1 : pas d’envoi entre 21h et 8h dans le fuseau cliente (sauf événements critiques).
 * Lot 6 branchera la file `notification_digest_queue` ; ici on ne fait que la décision.
 *
 * @param at — optionnel pour les tests (instant simulé) ; en prod, omettre pour « maintenant ».
 */
export function shouldSendNowOrQueue(
  _userId: string,
  eventType: string,
  timeZone: string,
  at: Date = new Date(),
): 'send' | 'queue_digest' {
  if (isCriticalEventType(eventType)) {
    return 'send';
  }
  if (isInQuietHours(timeZone, at)) {
    return 'queue_digest';
  }
  return 'send';
}

/** Entre 21:00 inclus et 08:00 exclus (heure locale). */
function isInQuietHours(timeZone: string, at: Date): boolean {
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(at);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? NaN);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? NaN);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return false;
  const mins = hour * 60 + minute;
  const startQuiet = 21 * 60;
  const endQuiet = 8 * 60;
  return mins >= startQuiet || mins < endQuiet;
}
