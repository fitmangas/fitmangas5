import type {
  NotifV2Category,
  NotifV2Item,
  NotifV2NextLive,
  NotifV2Period,
  NotifV2ReceiveLine,
} from '@/components/Notifications/v2/demo-data';

type Lang = 'fr' | 'es' | 'en';

const LOCALE: Record<Lang, string> = { fr: 'fr-FR', es: 'es-MX', en: 'en-GB' };

/** Clé AAAA-MM-JJ d'une date dans un fuseau donné. */
function dayKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  return parts; // en-CA => 2026-10-19
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000);
}

/** Période (aujourd'hui / hier / cette semaine / plus tôt) et libellé horaire, dans le fuseau de la cliente. */
export function notifWhen(
  iso: string,
  timeZone: string,
  lang: Lang,
  now: Date = new Date(),
): { period: NotifV2Period; when: string } {
  const date = new Date(iso);
  const locale = LOCALE[lang] ?? LOCALE.fr;
  const diffDays = daysBetween(dayKey(now, timeZone), dayKey(date, timeZone));
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);

  if (diffDays <= 0) {
    if (minutes < 1) return { period: 'today', when: lang === 'es' ? 'ahora' : lang === 'en' ? 'now' : 'à l’instant' };
    if (minutes < 60) {
      const label = lang === 'es' ? `hace ${minutes} min` : lang === 'en' ? `${minutes} min ago` : `il y a ${minutes} min`;
      return { period: 'today', when: label };
    }
    const time = new Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
    return { period: 'today', when: time };
  }
  if (diffDays === 1) {
    return { period: 'yesterday', when: lang === 'es' ? 'ayer' : lang === 'en' ? 'yesterday' : 'hier' };
  }
  if (diffDays < 7) {
    const weekday = new Intl.DateTimeFormat(locale, { timeZone, weekday: 'short' }).format(date);
    return { period: 'week', when: weekday };
  }
  const short = new Intl.DateTimeFormat(locale, { timeZone, day: 'numeric', month: 'short' }).format(date);
  return { period: 'earlier', when: short };
}

export function categoryFromKind(kind: string): NotifV2Category {
  if (kind.includes('cancelled') || kind.includes('schedule_changed')) return 'cancel';
  if (kind.startsWith('course.') || kind.startsWith('live.')) return 'live';
  if (kind.startsWith('blog.')) return 'blog';
  if (kind.startsWith('program.step') || kind.startsWith('program.completed')) return 'progress';
  if (kind.startsWith('program')) return 'programme';
  if (kind.startsWith('replay.') || kind.startsWith('content.') || kind.startsWith('standalone.')) return 'content';
  if (kind.startsWith('boutique.') || kind.startsWith('subscription.') || kind.startsWith('payment.') || kind.startsWith('gift.')) {
    return 'account';
  }
  if (kind.startsWith('community.') || kind.startsWith('referral.') || kind.startsWith('birthday.')) return 'community';
  return 'live';
}

export type NotificationRowV2 = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
  category?: string | null;
  action_url?: string | null;
  action_label?: string | null;
  meta?: { thumbs?: unknown; tag?: unknown } | null;
};

const CATEGORIES: NotifV2Category[] = ['live', 'programme', 'content', 'progress', 'cancel', 'account', 'community', 'blog'];

export function toCenterItem(row: NotificationRowV2, timeZone: string, lang: Lang, now: Date = new Date()): NotifV2Item {
  const category =
    row.category && (CATEGORIES as string[]).includes(row.category) ? (row.category as NotifV2Category) : categoryFromKind(row.kind);
  const { period, when } = notifWhen(row.created_at, timeZone, lang, now);
  const thumbs = Array.isArray(row.meta?.thumbs) ? (row.meta?.thumbs as unknown[]).filter((t): t is string => typeof t === 'string') : [];
  return {
    id: row.id,
    category,
    title: row.title,
    body: row.body ?? '',
    created_at: row.created_at,
    read_at: row.read_at,
    when,
    period,
    action_url: row.action_url ?? null,
    action_label: row.action_label ?? null,
    action_primary: category === 'live' && Boolean(row.action_url?.startsWith('/live/')),
    thumbs,
    tag: typeof row.meta?.tag === 'string' ? (row.meta?.tag as string) : null,
  };
}

/** Prochain live affiché dans la carte sombre (heures dans le fuseau de la cliente). */
export function nextLiveSummary(
  live: { courseId: string; title: string; startsAt: string; endsAt: string } | null,
  timeZone: string,
  lang: Lang,
  now: Date = new Date(),
): NotifV2NextLive {
  if (!live) return null;
  const locale = LOCALE[lang] ?? LOCALE.fr;
  const start = new Date(live.startsAt);
  const end = new Date(live.endsAt);
  const time = (d: Date) => new Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  const diffDays = daysBetween(dayKey(start, timeZone), dayKey(now, timeZone));
  const dayLabel =
    diffDays === 0
      ? lang === 'es'
        ? 'Hoy'
        : lang === 'en'
          ? 'Today'
          : 'Aujourd’hui'
      : diffDays === 1
        ? lang === 'es'
          ? 'Mañana'
          : lang === 'en'
            ? 'Tomorrow'
            : 'Demain'
        : new Intl.DateTimeFormat(locale, { timeZone, weekday: 'short', day: 'numeric', month: 'short' }).format(start);
  const minutes = Math.round((start.getTime() - now.getTime()) / 60_000);
  let inLabel: string | null = null;
  if (minutes > 0 && minutes < 180) {
    inLabel = lang === 'es' ? `en ${minutes} min` : lang === 'en' ? `in ${minutes} min` : `dans ${minutes} min`;
  }
  return {
    title: live.title,
    whenLabel: `${dayLabel.charAt(0).toUpperCase()}${dayLabel.slice(1)} · ${time(start)} – ${time(end)}`,
    startTime: time(start),
    inLabel,
    href: `/live/${live.courseId}`,
  };
}

type Prefs = Record<string, unknown> | null | undefined;

function on(prefs: Prefs, key: string, fallback: boolean): boolean {
  const v = prefs?.[key];
  return typeof v === 'boolean' ? v : fallback;
}

/** Résumé « Tu reçois… » à partir des préférences (valeurs par défaut de SPEC §3.8 si la colonne n'existe pas encore). */
export function receiveLines(
  prefs: Prefs,
  lang: Lang,
  programme: { days: string; time: string } | null,
): NotifV2ReceiveLine[] {
  const t =
    lang === 'es'
      ? {
          lives: 'Recordatorios de clases',
          livesOn: 'víspera + 1 h antes',
          session: 'Sesión del día',
          videos: 'Novedades en video',
          videosOn: '1×/día máx.',
          week: 'Tu semana',
          weekOn: 'dom. 18:00',
          off: 'desactivado',
        }
      : lang === 'en'
        ? {
            lives: 'Live reminders',
            livesOn: 'day before + 1 h before',
            session: 'Today’s session',
            videos: 'New videos',
            videosOn: '1×/day max',
            week: 'Your week',
            weekOn: 'Sun. 18:00',
            off: 'off',
          }
        : {
            lives: 'Rappels des lives',
            livesOn: 'veille + 1 h avant',
            session: 'Séance du jour',
            videos: 'Nouveautés vidéo',
            videosOn: '1×/jour max',
            week: 'Ta semaine',
            weekOn: 'dim. 18:00',
            off: 'désactivé',
          };
  const eve = on(prefs, 'live_eve_email', true) || on(prefs, 'live_eve_inapp', true);
  const hour = on(prefs, 'live_hour_email', true) || on(prefs, 'live_hour_inapp', true);
  const livesDetail = eve && hour ? t.livesOn : eve ? t.livesOn.split('+')[0].trim() : hour ? t.livesOn.split('+')[1]?.trim() ?? t.off : t.off;
  const lines: NotifV2ReceiveLine[] = [{ icon: 'radio', label: t.lives, detail: livesDetail }];
  if (programme) {
    const enabled = on(prefs, 'program_session_email', true) || on(prefs, 'program_session_inapp', true);
    lines.push({ icon: 'route', label: t.session, detail: enabled ? `${programme.days} · ${programme.time}` : t.off });
  }
  const videos = on(prefs, 'content_replay_email', true) || on(prefs, 'content_replay_inapp', true);
  lines.push({ icon: 'circle-play', label: t.videos, detail: videos ? t.videosOn : t.off });
  lines.push({ icon: 'mail', label: t.week, detail: on(prefs, 'weekly_digest_email', true) ? t.weekOn : t.off });
  return lines;
}
