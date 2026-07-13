/**
 * Ajout d’un cours au calendrier client (.ics + Google Agenda).
 * Les dates ICS/Google sont en UTC (Z) pour que le fuseau local du
 * destinataire affiche la bonne heure.
 */

export type CalendarEventInput = {
  id: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  location?: string | null;
  url?: string | null;
};

export type CalendarEventValidation =
  | { ok: true; startsAt: Date; endsAt: Date }
  | { ok: false; reason: string };

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/** UTC → AAAAMMJJTHHMMSSZ (format Google / iCal) */
export function formatUtcStamp(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}` +
    `T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`
  );
}

export function escapeIcalText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export function validateCalendarEvent(input: CalendarEventInput): CalendarEventValidation {
  if (!input.title?.trim()) {
    return { ok: false, reason: 'Titre du cours manquant.' };
  }
  if (!input.startsAt?.trim() || !input.endsAt?.trim()) {
    return { ok: false, reason: 'Horaires du cours manquants.' };
  }
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { ok: false, reason: 'Horaires du cours invalides.' };
  }
  if (endsAt.getTime() <= startsAt.getTime()) {
    return { ok: false, reason: 'La fin du cours est antérieure au début.' };
  }
  return { ok: true, startsAt, endsAt };
}

export function buildIcsContent(input: CalendarEventInput): string {
  const validated = validateCalendarEvent(input);
  if (!validated.ok) {
    throw new Error(validated.reason);
  }

  const stamp = formatUtcStamp(new Date());
  const dtStart = formatUtcStamp(validated.startsAt);
  const dtEnd = formatUtcStamp(validated.endsAt);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FitMangas//MemberCalendar//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${input.id}@fitmangas.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcalText(input.title.trim())}`,
    `DESCRIPTION:${escapeIcalText(input.description?.trim() || 'Cours FitMangas')}`,
  ];
  if (input.location?.trim()) {
    lines.push(`LOCATION:${escapeIcalText(input.location.trim())}`);
  }
  if (input.url?.trim()) {
    lines.push(`URL:${escapeIcalText(input.url.trim())}`);
  }
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

export function buildIcsCalendar(events: CalendarEventInput[]): string {
  if (events.length === 0) {
    throw new Error('Aucun cours à exporter.');
  }

  const stamp = formatUtcStamp(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FitMangas//MemberCalendar//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const input of events) {
    const validated = validateCalendarEvent(input);
    if (!validated.ok) {
      console.error('[buildIcsCalendar] skip event', validated.reason, input);
      continue;
    }
    lines.push(
      'BEGIN:VEVENT',
      `UID:${input.id}@fitmangas.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${formatUtcStamp(validated.startsAt)}`,
      `DTEND:${formatUtcStamp(validated.endsAt)}`,
      `SUMMARY:${escapeIcalText(input.title.trim())}`,
      `DESCRIPTION:${escapeIcalText(input.description?.trim() || 'Cours FitMangas')}`,
    );
    if (input.location?.trim()) {
      lines.push(`LOCATION:${escapeIcalText(input.location.trim())}`);
    }
    if (input.url?.trim()) {
      lines.push(`URL:${escapeIcalText(input.url.trim())}`);
    }
    lines.push('END:VEVENT');
  }

  if (lines.length <= 5) {
    throw new Error('Aucun cours valide à exporter.');
  }

  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

export function downloadIcsCalendar(events: CalendarEventInput[], filename = 'fitmangas-calendar.ics'): void {
  const content = buildIcsCalendar(events);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}

/** Téléchargement fiable d’un fichier .ics (mobile + desktop). */
export function downloadIcsFile(input: CalendarEventInput, filename?: string): void {
  const content = buildIcsContent(input);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeName =
    filename ??
    `fitmangas-${input.title.trim().toLowerCase().replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}.ics`;
  anchor.href = objectUrl;
  anchor.download = safeName.endsWith('.ics') ? safeName : `${safeName}.ics`;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}

export function buildGoogleCalendarUrl(input: CalendarEventInput): string {
  const validated = validateCalendarEvent(input);
  if (!validated.ok) {
    throw new Error(validated.reason);
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title.trim(),
    dates: `${formatUtcStamp(validated.startsAt)}/${formatUtcStamp(validated.endsAt)}`,
    details: input.description?.trim() || 'Cours FitMangas',
  });
  if (input.location?.trim()) {
    params.set('location', input.location.trim());
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function openGoogleCalendar(input: CalendarEventInput): void {
  const url = buildGoogleCalendarUrl(input);
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) {
    // Repli si le navigateur bloque le popup : navigation directe dans le même onglet
    window.location.assign(url);
  }
}
