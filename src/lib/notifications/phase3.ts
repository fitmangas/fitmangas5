import type { SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

import { wrapResendEmail } from '@/lib/email/base-template';
import { countActiveQualifiedReferrals, REFERRAL_REWARD_THRESHOLD } from '@/lib/referrals/reward';

import { dispatch } from './dispatcher';
import { mergePrefs } from './defaults';
import { calendarDayKeyInTimeZone, formatInUserTimezone } from './timezone';
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

type DigestLocale = 'fr' | 'es';

export type DigestSummary = {
  attendedThisWeek: number;
  nextCourseTitle: string | null;
  nextCourseWhen: string | null;
  blogTitles: string[];
  replayTitles: string[];
  referralActiveCount: number;
  referralRewardActive: boolean;
};

export async function buildDigestSummaryForUser(
  client: SupabaseClient,
  userId: string,
  tz: string,
  locale: DigestLocale,
  now: Date,
): Promise<DigestSummary> {
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const nowIso = now.toISOString();

  const { count: attendedThisWeek } = await client
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'attended')
    .gte('updated_at', weekAgo);

  const { data: bookedRows } = await client
    .from('enrollments')
    .select('courses ( title, starts_at, timezone )')
    .eq('user_id', userId)
    .eq('status', 'booked');

  type BookedRow = {
    courses:
      | { title: string; starts_at: string; timezone: string | null }
      | Array<{ title: string; starts_at: string; timezone: string | null }>
      | null;
  };

  let nextCourseTitle: string | null = null;
  let nextCourseWhen: string | null = null;
  let nextStartsAt: string | null = null;
  for (const row of (bookedRows ?? []) as BookedRow[]) {
    const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
    if (!course?.starts_at || course.starts_at <= nowIso) continue;
    if (!nextStartsAt || course.starts_at < nextStartsAt) {
      nextStartsAt = course.starts_at;
      nextCourseTitle = course.title;
      const courseTz = course.timezone?.trim() || tz;
      nextCourseWhen = formatInUserTimezone(new Date(course.starts_at), courseTz, locale, 'PPPP HH:mm');
    }
  }

  const titleCol = locale === 'es' ? 'title_es' : 'title_fr';
  const { data: articles } = await client
    .from('blog_articles')
    .select(`${titleCol}, published_at`)
    .eq('status', 'published')
    .gte('published_at', weekAgo)
    .order('published_at', { ascending: false })
    .limit(12);

  const blogTitles = ((articles ?? []) as Record<string, string | null>[])
    .map((a) => a[titleCol])
    .filter((t): t is string => Boolean(t?.trim()));

  const { data: replays } = await client
    .from('standalone_vimeo_videos')
    .select('title, published_at')
    .eq('validation_status', 'published')
    .eq('is_hidden', false)
    .gte('published_at', weekAgo)
    .order('published_at', { ascending: false })
    .limit(12);

  const replayTitles = ((replays ?? []) as { title: string | null }[])
    .map((r) => r.title?.trim())
    .filter((t): t is string => Boolean(t));

  const referralActiveCount = await countActiveQualifiedReferrals(client, userId);
  const { data: prof } = await client.from('profiles').select('referral_reward_active').eq('id', userId).maybeSingle();

  return {
    attendedThisWeek: attendedThisWeek ?? 0,
    nextCourseTitle,
    nextCourseWhen,
    blogTitles,
    replayTitles,
    referralActiveCount,
    referralRewardActive: prof?.referral_reward_active === true,
  };
}

function formatQueuedContentLines(
  locale: DigestLocale,
  rows: { digest_bucket: string; payload: Record<string, unknown> }[],
): string[] {
  const lines: string[] = [];
  for (const row of rows) {
    const eventType = String(row.payload.event_type ?? '');
    const title =
      String(row.payload.title ?? '').trim() ||
      String((row.payload.payload as { title?: string } | undefined)?.title ?? '').trim();
    if (eventType.startsWith('blog.')) {
      lines.push(locale === 'es' ? `• Artículo : ${title || 'Blog'}` : `• Article : ${title || 'Blog'}`);
      continue;
    }
    if (eventType.startsWith('replay.')) {
      lines.push(locale === 'es' ? `• Replay : ${title || 'Nuevo replay'}` : `• Replay : ${title || 'Nouveau replay'}`);
      continue;
    }
    // Quiet-hours / autres : ne pas lister les événements cours (déjà temps réel).
    if (row.digest_bucket === 'courses' || eventType.startsWith('course.')) continue;
    if (title) lines.push(`• ${title}`);
  }
  return lines;
}

function formatDigestSummaryLines(
  locale: DigestLocale,
  summary: DigestSummary,
  queuedLines: string[],
): string {
  const articleCount = summary.blogTitles.length;
  const replayCount = summary.replayTitles.length;
  const lines: string[] = [];

  if (locale === 'es') {
    lines.push(
      `Esta semana : ${articleCount} artículo${articleCount === 1 ? '' : 's'} nuevo${articleCount === 1 ? '' : 's'} + ${replayCount} replay${replayCount === 1 ? '' : 's'} nuevo${replayCount === 1 ? '' : 's'}.`,
    );
    if (summary.blogTitles.length) {
      lines.push('En el blog :');
      for (const title of summary.blogTitles) lines.push(`• ${title}`);
    }
    if (summary.replayTitles.length) {
      lines.push('Replays :');
      for (const title of summary.replayTitles) lines.push(`• ${title}`);
    }
    lines.push(
      `Has seguido ${summary.attendedThisWeek} sesión${summary.attendedThisWeek === 1 ? '' : 'es'}.`,
    );
    if (summary.nextCourseTitle && summary.nextCourseWhen) {
      lines.push(`Próxima sesión : ${summary.nextCourseTitle} — ${summary.nextCourseWhen}.`);
    }
    if (summary.referralActiveCount > 0 || summary.referralRewardActive) {
      if (summary.referralRewardActive) {
        lines.push('Apadrinamiento : tu recompensa mensual está activa.');
      } else {
        lines.push(
          `Apadrinamiento : ${summary.referralActiveCount}/${REFERRAL_REWARD_THRESHOLD} referidas activas.`,
        );
      }
    }
  } else {
    lines.push(
      `Cette semaine : ${articleCount} article${articleCount > 1 ? 's' : ''} + ${replayCount} replay${replayCount > 1 ? 's' : ''}.`,
    );
    if (summary.blogTitles.length) {
      lines.push('Sur le blog :');
      for (const title of summary.blogTitles) lines.push(`• ${title}`);
    }
    if (summary.replayTitles.length) {
      lines.push('Replays :');
      for (const title of summary.replayTitles) lines.push(`• ${title}`);
    }
    lines.push(`Tu as suivi ${summary.attendedThisWeek} cours.`);
    if (summary.nextCourseTitle && summary.nextCourseWhen) {
      lines.push(`Prochain cours : ${summary.nextCourseTitle} — ${summary.nextCourseWhen}.`);
    }
    if (summary.referralActiveCount > 0 || summary.referralRewardActive) {
      if (summary.referralRewardActive) {
        lines.push('Parrainage : ta récompense mensuelle est active.');
      } else {
        lines.push(
          `Parrainage : ${summary.referralActiveCount}/${REFERRAL_REWARD_THRESHOLD} filleules actives.`,
        );
      }
    }
  }
  if (queuedLines.length) {
    lines.push(locale === 'es' ? 'También en tu fil :' : 'Aussi dans ta file :');
    lines.push(...queuedLines);
  }
  return lines.join('\n');
}

export async function processDigestQueue(client: SupabaseClient, deps: Phase3Deps = {}) {
  const now = deps.now ?? new Date();

  // Destinataires = members (pas seulement les lignes prefs existantes).
  const { data: members, error: membersError } = await client.from('profiles').select('id, display_timezone, preferred_locale').eq('role', 'member');
  if (membersError) throw membersError;

  let sent = 0;
  for (const member of (members ?? []) as {
    id: string;
    display_timezone?: string | null;
    preferred_locale?: string | null;
  }[]) {
    const { data: prefRow } = await client
      .from('notification_preferences')
      .select('*')
      .eq('user_id', member.id)
      .maybeSingle();
    const prefs = mergePrefs(prefRow ?? null);
    if (prefs.silence_mode_enabled) continue;
    if (!prefs.content_email_enabled) continue;

    const tz = member.display_timezone?.trim() || 'Europe/Paris';
    if (localHour(now, tz) !== 8) continue;

    // Contenu = digest lundi (même si digest_frequency était « off » en base :
    // c’est désormais le seul canal pour blog/replays standalone).
    const contentDigestDay = isMonday(now, tz);
    const scheduledDigest =
      prefs.digest_frequency === 'daily' ||
      (prefs.digest_frequency === 'weekly' && contentDigestDay) ||
      (prefs.digest_frequency === 'off' && contentDigestDay);
    if (!scheduledDigest) continue;

    const { data: queued } = await client
      .from('notification_digest_queue')
      .select('id, digest_bucket, payload')
      .eq('user_id', member.id)
      .is('processed_at', null);
    const rows = (queued ?? []) as { id: string; digest_bucket: string; payload: Record<string, unknown> }[];

    const locale: DigestLocale = member.preferred_locale === 'es' ? 'es' : 'fr';
    const summary = await buildDigestSummaryForUser(client, member.id, tz, locale, now);
    const hasContent = summary.blogTitles.length > 0 || summary.replayTitles.length > 0 || rows.length > 0;
    // Pas d’email vide : le digest est le canal contenu, pas un ping gratuit.
    if (!hasContent) continue;

    const { data: userData } = await client.auth.admin.getUserById(member.id);
    const email = userData.user?.email;
    if (!email) continue;

    const queuedLines = formatQueuedContentLines(locale, rows);
    const summaryLines = formatDigestSummaryLines(locale, summary, queuedLines);

    const template = getEmailTemplate('digest.summary');
    if (!template) continue;
    const rendered = renderTemplate(template, locale, {
      date: calendarDayKeyInTimeZone(tz, now),
      summaryLines,
      appUrl: `${appUrl()}/compte`,
    });
    const html = wrapResendEmail({
      innerHtml: rendered.html,
      locale,
      showPreferencesLink: true,
    });
    const ok = await sendEmail(email, rendered.subject, html);
    if (!ok) continue;

    if (rows.length) {
      await client
        .from('notification_digest_queue')
        .update({ processed_at: now.toISOString() })
        .eq('user_id', member.id)
        .is('processed_at', null);
    }
    await client.from('notification_log').insert({
      user_id: member.id,
      event_type: 'digest.summary',
      channel: 'email',
      payload: {
        digest_count: rows.length,
        articleCount: summary.blogTitles.length,
        replayCount: summary.replayTitles.length,
        attendedThisWeek: summary.attendedThisWeek,
      },
      idempotency_key: `digest.summary:${member.id}:${calendarDayKeyInTimeZone(tz, now)}:${prefs.digest_frequency}`,
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
