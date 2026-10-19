/** Fenêtre d’envoi 9:00–20:00 dans le fuseau de la personne (SPEC §12.3). */

export function timezoneForMarket(market: 'fr' | 'mx' | string | null | undefined): string {
  return market === 'mx' ? 'America/Mexico_City' : 'Europe/Paris';
}

export function clampFollowupToSendWindow(iso: string, timeZone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone, hour: 'numeric', hourCycle: 'h23' }).format(date),
  );
  if (hour >= 9 && hour < 20) return date.toISOString();

  const shifted = new Date(date);
  if (hour >= 20) shifted.setUTCDate(shifted.getUTCDate() + 1);

  for (let i = 0; i < 48; i += 1) {
    const candidate = new Date(shifted.getTime() + i * 3600000);
    const h = Number(
      new Intl.DateTimeFormat('en-GB', { timeZone, hour: 'numeric', hourCycle: 'h23' }).format(candidate),
    );
    if (h === 9) return candidate.toISOString();
  }
  return date.toISOString();
}

export function foldAccents(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}
