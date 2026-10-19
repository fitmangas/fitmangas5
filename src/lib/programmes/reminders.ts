import type { SupabaseClient } from '@supabase/supabase-js';

import { dispatch } from '@/lib/notifications/dispatcher';
import { isNotifV2Enabled } from '@/lib/notifications/v2/flag';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { getEmailPublicBaseUrl } from '@/lib/email/base-template';

function isoWeekdayParis(now: Date): number {
  const w = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', weekday: 'short' }).format(now);
  return ({ Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 } as Record<string, number>)[w] ?? 0;
}

function hourParis(now: Date): number {
  const value = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', hour12: false })
    .formatToParts(now)
    .find((part) => part.type === 'hour')?.value;
  return Number(value ?? NaN);
}

function todayParis(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/**
 * « Ta séance du jour » (A07) : jours + heure choisis, exemptée du silence (event program.session).
 * No-op si drapeaux off ou tables absentes. Fuseau prudent : Europe/Paris (pas Mexico tant que le profil n’est pas joint).
 */
export async function enqueueProgramSessionReminders(admin: SupabaseClient, now = new Date()) {
  if (!isProgrammesEnabled() || !isNotifV2Enabled()) return { skipped: 'flag' as const, queued: 0 };
  try {
    const { data, error } = await admin
      .from('program_enrollments')
      .select('id, user_id, chosen_days, reminder_time, postponed_until, reminder_email, reminder_inapp, reminder_push, programs(slug, title)')
      .eq('status', 'active');
    if (error) {
      console.error('[programmes] reminders select', error.message);
      return { skipped: 'tables' as const, queued: 0 };
    }
    const weekday = isoWeekdayParis(now);
    const hour = hourParis(now);
    const today = todayParis(now);
    let queued = 0;
    for (const row of data ?? []) {
      const days = (row.chosen_days as number[] | null) ?? [];
      if (!days.includes(weekday)) continue;
      const time = String(row.reminder_time ?? '18:00').slice(0, 5);
      const reminderHour = Number(time.split(':')[0]);
      if (reminderHour !== hour) continue;
      if (row.postponed_until && String(row.postponed_until) >= today) continue;
      const prog = row.programs as { slug?: string; title?: { fr?: string } } | { slug?: string; title?: { fr?: string } }[] | null;
      const program = Array.isArray(prog) ? prog[0] : prog;
      const slug = program?.slug ?? '';
      const title = program?.title?.fr ?? 'ta séance';
      const programUrl = `${getEmailPublicBaseUrl()}/compte/programmes/${slug}`;
      const hints: Array<'email' | 'in_app' | 'push'> = [];
      if (row.reminder_email) hints.push('email');
      if (row.reminder_inapp) hints.push('in_app');
      if (row.reminder_push) hints.push('push');
      if (!hints.length) continue;
      await dispatch(admin, {
        event_type: 'program.session.reminder',
        user_id: row.user_id as string,
        payload: {
          title: `Aujourd’hui : ${title}`,
          body: 'Ta séance du jour est prête.',
          courseTitle: title,
          programUrl,
          joinUrl: programUrl,
        },
        channel_hints: hints,
        idempotency_key: `program.session.reminder:${row.id}:${today}`,
      });
      queued += 1;
    }
    return { queued };
  } catch (e) {
    console.error('[programmes] reminders', e);
    return { skipped: 'tables' as const, queued: 0 };
  }
}
