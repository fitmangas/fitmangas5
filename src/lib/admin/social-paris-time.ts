import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

import { SOCIAL_CM_GUIDELINES } from '@/lib/admin/social-cm-playbook';
import type { SocialNetwork } from '@/lib/admin/social-comms';

const PARIS_TZ = 'Europe/Paris';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function formatParisDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function parseParisSchedule(iso: string | null): { date: string; hour: number } {
  if (!iso) {
    const today = formatInTimeZone(new Date(), PARIS_TZ, 'yyyy-MM-dd');
    return { date: today, hour: 12 };
  }
  return {
    date: formatInTimeZone(iso, PARIS_TZ, 'yyyy-MM-dd'),
    hour: Number(formatInTimeZone(iso, PARIS_TZ, 'H')),
  };
}

export function parisScheduleToIso(date: string, hour: number): string | null {
  if (!date) return null;
  const local = `${date}T${pad(hour)}:00:00`;
  return fromZonedTime(local, PARIS_TZ).toISOString();
}

export function allowedParisHours(network: SocialNetwork): number[] {
  return SOCIAL_CM_GUIDELINES[network].bestHours;
}
