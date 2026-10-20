/**
 * Fenêtre de messagerie Meta (Instagram, Messenger, WhatsApp).
 *
 * Un message automatique (messaging_type RESPONSE) n'est accepté que dans les 24 h qui suivent le dernier
 * message de la personne ; au-delà, Meta refuse l'envoi. Une relance à J+2, J+5 ou J+7 sans nouvelle réponse
 * ne peut donc jamais partir. Avec CROISSANCE_V2, la relance est planifiée AVANT la fin de cette fenêtre,
 * entre 9 h et 18 h (heure de la personne), et une relance dont la fenêtre est fermée est annulée sans appel à Meta.
 */

const HOUR_MS = 3_600_000;
const STEP_MS = 15 * 60_000;

export const META_WINDOW_HOURS = 24;
/** Les relances partent toutes les 2 h (cron à :05) : marge pour que l'envoi réel reste dans les 24 h. */
export const FOLLOWUP_DISPATCH_MARGIN_HOURS = 3;
/** Heures de planification (locales) : l'envoi réel part au plus 2 h après, donc avant 20 h. */
export const FOLLOWUP_PLAN_START_HOUR = 9;
export const FOLLOWUP_PLAN_END_HOUR = 18;

/** Canaux soumis à la règle des 24 h (tout sauf l'e-mail et les canaux sans messagerie Meta). */
export function isMetaMessagingChannel(channel: string | null | undefined): boolean {
  return channel === 'instagram' || channel === 'facebook' || channel === 'whatsapp';
}

function localHour(ms: number, timeZone: string): number {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone, hour: 'numeric', hourCycle: 'h23' }).format(new Date(ms)));
}

/**
 * Heure d'une relance compatible avec la fenêtre Meta : au plus tard 21 h après maintenant (24 h − marge d'envoi),
 * jamais après l'heure demandée, et entre 9 h et 18 h dans le fuseau de la personne (le créneau le plus tardif possible).
 */
export function planFollowupInMetaWindow(requestedIso: string, nowMs: number, timeZone: string): string {
  const requested = Date.parse(requestedIso);
  const latest = nowMs + (META_WINDOW_HOURS - FOLLOWUP_DISPATCH_MARGIN_HOURS) * HOUR_MS;
  const target = Number.isNaN(requested) ? latest : Math.min(requested, latest);
  for (let t = target; t >= nowMs; t -= STEP_MS) {
    const h = localHour(t, timeZone);
    if (h >= FOLLOWUP_PLAN_START_HOUR && h < FOLLOWUP_PLAN_END_HOUR) return new Date(t).toISOString();
  }
  // Aucun créneau de jour avant l'heure demandée (ex. relance immédiate de test) : on garde l'heure demandée.
  return new Date(Math.max(nowMs, target)).toISOString();
}

/** Date du dernier message reçu de la personne (null si aucun). */
export function lastInboundAt(messages: Array<{ direction: string; createdAt: string }>): string | null {
  let best: number | null = null;
  for (const m of messages) {
    if (m.direction !== 'inbound') continue;
    const t = Date.parse(m.createdAt);
    if (!Number.isNaN(t) && (best === null || t > best)) best = t;
  }
  return best === null ? null : new Date(best).toISOString();
}

/** Vrai si Meta accepte encore un message automatique (dernier message de la personne il y a moins de 24 h). */
export function isMetaWindowOpen(lastInboundIso: string | null | undefined, nowMs: number): boolean {
  if (!lastInboundIso) return false;
  const last = Date.parse(lastInboundIso);
  if (Number.isNaN(last)) return false;
  return nowMs - last < META_WINDOW_HOURS * HOUR_MS;
}
