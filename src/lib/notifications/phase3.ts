import type { SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

import { dispatch } from './dispatcher';
import { calendarDayKeyInTimeZone } from './timezone';
import { renderTemplate, getEmailTemplate } from './templates';

type DispatchFn = typeof dispatch;

type Phase3Deps = {
  dispatch?: DispatchFn;
  now?: Date;
};

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(/\/$/, '');
}

function localHour(date: Date, timeZone: string) {
  const value = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hour12: false })
    .formatToParts(date)
    .find((part) => part.type === 'hour')?.value;
  return Number(value ?? NaN);
}

function isMonday(date: Date, timeZone: string) {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
  return weekday === 'Mon';
}

async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.NEWSLETTER_FROM_EMAIL?.trim();
  if (!key || !from) return false;
  await new Resend(key).emails.send({ from, to, subject, html });
  return true;
}

export async function dispatchProductPublished(client: SupabaseClient, product: { id: string; name: string }, deps: Phase3Deps = {}) {
  const dispatchFn = deps.dispatch ?? dispatch;
  const { data: members, error } = await client.from('profiles').select('id').eq('role', 'member');
  if (error) throw error;
  let sent = 0;
  for (const member of (members ?? []) as { id: string }[]) {
    await dispatchFn(client, {
      event_type: 'boutique.product_published',
      user_id: member.id,
      payload: {
        title: `Nouveau dans la boutique : ${product.name}`,
        body: `Nouveau dans la boutique : ${product.name}`,
        product_id: product.id,
        product_name: product.name,
      },
      channel_hints: ['in_app'],
      idempotency_key: `boutique.product_published:${product.id}:${member.id}`,
    });
    sent += 1;
  }
  return { sent };
}

export async function dispatchBoutiqueOrderPaid(client: SupabaseClient, params: { userId: string; orderRef: string }, deps: Phase3Deps = {}) {
  await (deps.dispatch ?? dispatch)(client, {
    event_type: 'boutique.order_paid',
    user_id: params.userId,
    payload: {
      title: `Commande confirmée — ${params.orderRef}`,
      body: `Votre commande ${params.orderRef} est confirmée.`,
      orderRef: params.orderRef,
    },
    channel_hints: ['in_app', 'email'],
    idempotency_key: `boutique.order_paid:${params.orderRef}:${params.userId}`,
  });
}

export async function dispatchBoutiqueOrderShipped(client: SupabaseClient, params: { userId: string; orderRef: string; trackingUrl?: string | null }, deps: Phase3Deps = {}) {
  await (deps.dispatch ?? dispatch)(client, {
    event_type: 'boutique.order_shipped',
    user_id: params.userId,
    payload: {
      title: 'Votre commande est expédiée',
      body: params.trackingUrl ? `Suivi : ${params.trackingUrl}` : 'Votre commande est expédiée.',
      orderRef: params.orderRef,
      trackingUrl: params.trackingUrl,
    },
    channel_hints: ['in_app', 'email', 'push'],
    idempotency_key: `boutique.order_shipped:${params.orderRef}:${params.userId}`,
  });
}

export async function dispatchBoutiqueOrderDelivered(client: SupabaseClient, params: { userId: string; orderRef: string }, deps: Phase3Deps = {}) {
  await (deps.dispatch ?? dispatch)(client, {
    event_type: 'boutique.order_delivered',
    user_id: params.userId,
    payload: {
      title: 'Votre commande est livrée !',
      body: `Votre commande ${params.orderRef} est livrée !`,
      orderRef: params.orderRef,
    },
    channel_hints: ['in_app'],
    idempotency_key: `boutique.order_delivered:${params.orderRef}:${params.userId}`,
  });
}

export async function runCommunityCycles(client: SupabaseClient, deps: Phase3Deps = {}) {
  const now = deps.now ?? new Date();
  const dispatchFn = deps.dispatch ?? dispatch;
  const { data: profiles, error } = await client
    .from('profiles')
    .select('id, first_name, birth_date, display_timezone')
    .eq('role', 'member');
  if (error) throw error;

  let sent = 0;
  for (const profile of (profiles ?? []) as { id: string; first_name: string | null; birth_date: string | null; display_timezone: string | null }[]) {
    const tz = profile.display_timezone || 'Europe/Paris';
    if (localHour(now, tz) !== 9) continue;
    if (!profile.birth_date) continue;
    const today = calendarDayKeyInTimeZone(tz, now).slice(5);
    if (profile.birth_date.slice(5) !== today) continue;
    await dispatchFn(client, {
      event_type: 'community.birthday',
      user_id: profile.id,
      payload: {
        title: `Joyeux anniversaire ${profile.first_name ?? ''} ! 🎂`,
        body: 'Toute l’équipe FitMangas vous souhaite une journée lumineuse.',
        firstName: profile.first_name,
      },
      channel_hints: ['in_app', 'email'],
      idempotency_key: `community.birthday:${profile.id}:${calendarDayKeyInTimeZone(tz, now).slice(0, 4)}`,
    });
    sent += 1;
  }
  return { sent };
}

export async function runWeMissYouCycles(client: SupabaseClient, deps: Phase3Deps = {}) {
  const now = deps.now ?? new Date();
  const dispatchFn = deps.dispatch ?? dispatch;
  const { data } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  let sent = 0;
  for (const user of data.users) {
    if (!user.last_sign_in_at) continue;
    const inactiveDays = Math.floor((now.getTime() - new Date(user.last_sign_in_at).getTime()) / 86400000);
    const target = inactiveDays >= 60 ? 60 : inactiveDays >= 30 ? 30 : 0;
    if (!target) continue;
    await dispatchFn(client, {
      event_type: target === 60 ? 'community.we_miss_you_60d' : 'community.we_miss_you_30d',
      user_id: user.id,
      payload: {
        title: target === 60 ? 'Alejandra aimerait avoir de vos nouvelles' : 'Vous nous manquez !',
        body: target === 60 ? 'Revenez quand vous voulez, même pour une séance douce.' : 'Reprenez votre routine Pilates à votre rythme.',
      },
      channel_hints: target === 60 ? ['email'] : ['in_app', 'email'],
      idempotency_key: `community.we_miss_you_${target}d:${user.id}:${Math.floor(inactiveDays / target)}`,
    });
    sent += 1;
  }
  return { sent };
}

export async function processDigestQueue(client: SupabaseClient, deps: Phase3Deps = {}) {
  const now = deps.now ?? new Date();
  const { data: prefs, error } = await client
    .from('notification_preferences')
    .select('user_id, digest_frequency, profiles!inner(display_timezone, preferred_locale)')
    .in('digest_frequency', ['daily', 'weekly']);
  if (error) throw error;

  let sent = 0;
  for (const pref of (prefs ?? []) as { user_id: string; digest_frequency: 'daily' | 'weekly'; profiles: { display_timezone?: string | null; preferred_locale?: string | null } | Array<{ display_timezone?: string | null; preferred_locale?: string | null }> }[]) {
    const profile = Array.isArray(pref.profiles) ? pref.profiles[0] : pref.profiles;
    const tz = profile?.display_timezone || 'Europe/Paris';
    if (localHour(now, tz) !== 8) continue;
    if (pref.digest_frequency === 'weekly' && !isMonday(now, tz)) continue;

    const { data: queued } = await client
      .from('notification_digest_queue')
      .select('id, digest_bucket, payload')
      .eq('user_id', pref.user_id)
      .is('processed_at', null);
    const rows = (queued ?? []) as { id: string; digest_bucket: string; payload: Record<string, unknown> }[];
    if (rows.length === 0) continue;

    const { data: userData } = await client.auth.admin.getUserById(pref.user_id);
    const email = userData.user?.email;
    if (!email) continue;
    const items = rows.map((row) => `• ${row.digest_bucket}: ${String(row.payload.event_type ?? 'FitMangas')}`).join('\n');
    const template = getEmailTemplate('digest.summary');
    if (!template) continue;
    const locale = profile?.preferred_locale === 'es' ? 'es' : 'fr';
    const rendered = renderTemplate(template, locale, { date: calendarDayKeyInTimeZone(tz, now), items });
    const ok = await sendEmail(email, rendered.subject, rendered.html);
    if (!ok) continue;

    await client.from('notification_digest_queue').update({ processed_at: now.toISOString() }).eq('user_id', pref.user_id).is('processed_at', null);
    await client.from('notification_log').insert({
      user_id: pref.user_id,
      event_type: 'digest.summary',
      channel: 'email',
      payload: { digest_count: rows.length },
      idempotency_key: `digest.summary:${pref.user_id}:${calendarDayKeyInTimeZone(tz, now)}:${pref.digest_frequency}`,
    });
    sent += 1;
  }
  return { sent };
}

export async function runPhase3DailyJobs(client: SupabaseClient, deps: Phase3Deps = {}) {
  const [community, weMissYou, digestResult] = await Promise.all([
    runCommunityCycles(client, deps),
    runWeMissYouCycles(client, deps),
    processDigestQueue(client, deps),
  ]);
  return { community, weMissYou, digest: digestResult };
}
