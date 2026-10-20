'use client';

import Link from 'next/link';
import {
  BookOpen,
  CalendarX,
  CheckCheck,
  CircleCheck,
  CirclePlay,
  CreditCard,
  Gift,
  Mail,
  Radio,
  Route,
  Settings2,
  Smartphone,
  Timer,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';

import type { NotifV2Category, NotifV2Item, NotifV2NextLive, NotifV2Period, NotifV2ReceiveLine } from './demo-data';

const ICONS: Record<NotifV2Category, { Icon: LucideIcon; tone: string }> = {
  live: { Icon: Radio, tone: 'orange' },
  programme: { Icon: Route, tone: 'logo' },
  content: { Icon: CirclePlay, tone: 'green' },
  progress: { Icon: CircleCheck, tone: 'green' },
  cancel: { Icon: CalendarX, tone: 'rose' },
  account: { Icon: CreditCard, tone: 'blue' },
  community: { Icon: Gift, tone: 'logo' },
  blog: { Icon: BookOpen, tone: 'amber' },
};

const RECEIVE_ICONS: Record<NotifV2ReceiveLine['icon'], LucideIcon> = {
  radio: Radio,
  route: Route,
  'circle-play': CirclePlay,
  mail: Mail,
};

type Filter = 'all' | 'live' | 'programme' | 'content' | 'account';

type Lang = 'fr' | 'es' | 'en';

const COPY = {
  fr: {
    kicker: 'Espace client',
    title: 'Notifications',
    subtitle: (n: number) => (n > 1 ? `${n} nouvelles` : n === 1 ? '1 nouvelle' : 'Rien de nouveau') + ' · tout ce qui compte, au même endroit.',
    markAll: 'Tout marquer comme lu',
    prefs: 'Préférences',
    all: 'Tout',
    lives: 'Lives',
    programme: 'Programme',
    content: 'Vidéos & blog',
    account: 'Compte',
    periods: { today: 'Aujourd’hui', yesterday: 'Hier', week: 'Cette semaine', earlier: 'Plus tôt' } as Record<NotifV2Period, string>,
    older: 'Voir les plus anciennes',
    empty: 'Aucune notification pour le moment.',
    nextLive: 'Prochain live',
    startsAt: 'Début à',
    linkOpen: 'le lien est déjà ouvert',
    join: 'Rejoindre le live',
    noLive: 'Aucun live publié pour l’instant : tu recevras un rappel la veille dès qu’il sera au planning.',
    receive: 'Tu reçois…',
    manage: 'Gérer mes notifications',
    phoneTitle: 'Notifications sur ton téléphone',
    phoneBody: 'Ajoute FitMangas à ton écran d’accueil pour recevoir les rappels même app fermée.',
    phoneCta: 'Activer',
  },
  es: {
    kicker: 'Espacio cliente',
    title: 'Notificaciones',
    subtitle: (n: number) => (n > 1 ? `${n} nuevas` : n === 1 ? '1 nueva' : 'Nada nuevo') + ' · todo lo importante, en un solo lugar.',
    markAll: 'Marcar todo como leído',
    prefs: 'Preferencias',
    all: 'Todo',
    lives: 'Clases en vivo',
    programme: 'Programa',
    content: 'Videos y blog',
    account: 'Cuenta',
    periods: { today: 'Hoy', yesterday: 'Ayer', week: 'Esta semana', earlier: 'Antes' } as Record<NotifV2Period, string>,
    older: 'Ver las más antiguas',
    empty: 'Todavía no hay notificaciones.',
    nextLive: 'Próxima clase en vivo',
    startsAt: 'Empieza a las',
    linkOpen: 'el enlace ya está abierto',
    join: 'Unirme a la clase',
    noLive: 'Aún no hay clases publicadas: recibirás un recordatorio la víspera en cuanto estén en el calendario.',
    receive: 'Recibes…',
    manage: 'Gestionar mis notificaciones',
    phoneTitle: 'Notificaciones en tu teléfono',
    phoneBody: 'Añade FitMangas a tu pantalla de inicio para recibir los recordatorios incluso con la app cerrada.',
    phoneCta: 'Activar',
  },
  en: {
    kicker: 'Client area',
    title: 'Notifications',
    subtitle: (n: number) => (n > 1 ? `${n} new` : n === 1 ? '1 new' : 'Nothing new') + ' · everything that matters, in one place.',
    markAll: 'Mark all as read',
    prefs: 'Preferences',
    all: 'All',
    lives: 'Lives',
    programme: 'Programme',
    content: 'Videos & blog',
    account: 'Account',
    periods: { today: 'Today', yesterday: 'Yesterday', week: 'This week', earlier: 'Earlier' } as Record<NotifV2Period, string>,
    older: 'See older ones',
    empty: 'No notifications yet.',
    nextLive: 'Next live',
    startsAt: 'Starts at',
    linkOpen: 'the link is already open',
    join: 'Join the live',
    noLive: 'No live published yet: you will get a reminder the day before as soon as it is scheduled.',
    receive: 'You receive…',
    manage: 'Manage my notifications',
    phoneTitle: 'Notifications on your phone',
    phoneBody: 'Add FitMangas to your home screen to get reminders even when the app is closed.',
    phoneCta: 'Turn on',
  },
} as const;

const PERIOD_ORDER: NotifV2Period[] = ['today', 'yesterday', 'week', 'earlier'];

function filterOf(category: NotifV2Category): Filter {
  if (category === 'live' || category === 'cancel') return 'live';
  if (category === 'programme' || category === 'progress') return 'programme';
  if (category === 'content' || category === 'blog') return 'content';
  return 'account';
}

function NotifRow({ row }: { row: NotifV2Item }) {
  const unread = !row.read_at;
  const { Icon, tone } = ICONS[row.category];
  return (
    <li
      className={`relative flex gap-4 rounded-[1.25rem] p-4 md:p-5 ${unread ? 'bg-white shadow-[0_10px_26px_rgba(31,27,22,0.08)]' : ''}`}
    >
      <span className={`kpi-icon-wrap kpi-icon-wrap--${tone} !h-11 !w-11 shrink-0`}>
        <Icon size={19} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p
            className={`text-[14.5px] leading-snug ${unread ? 'font-semibold text-luxury-ink' : 'font-medium text-luxury-ink/80'}`}
          >
            {row.title}
          </p>
          {row.when ? (
            <span
              className={`shrink-0 whitespace-nowrap pt-0.5 text-[11.5px] ${unread ? 'font-semibold text-luxury-orange' : 'text-luxury-soft'}`}
            >
              {row.when}
            </span>
          ) : null}
        </div>
        {row.body ? <p className="mt-1 text-[13.5px] leading-relaxed text-luxury-muted">{row.body}</p> : null}
        {row.thumbs?.length ? (
          <div className="mt-3 flex items-center gap-2">
            {row.thumbs.slice(0, 4).map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" className="h-14 w-20 rounded-xl object-cover" />
            ))}
          </div>
        ) : null}
        {(row.action_url && row.action_label) || row.tag ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {row.action_url && row.action_label ? (
              row.action_primary ? (
                <Link href={row.action_url} className="btn-luxury-primary !px-5 !py-2.5 !text-[10px]">
                  {row.action_label}
                </Link>
              ) : (
                <Link href={row.action_url} className="btn-luxury-ghost !px-4 !py-2 !text-[10px]">
                  {row.action_label}
                </Link>
              )
            ) : null}
            {row.tag ? <span className="fm-tag">{row.tag}</span> : null}
          </div>
        ) : null}
      </div>
      {unread ? <span className="fm-dot absolute left-2 top-1/2 -translate-y-1/2" /> : null}
    </li>
  );
}

export function NotificationsCenterV2({
  items,
  unreadCount,
  nextLive = null,
  receive = [],
  lang = 'fr',
  showProgrammeFilter = false,
  showPhoneCard = true,
  olderHref = null,
  markAllAction,
}: {
  items: NotifV2Item[];
  unreadCount: number;
  nextLive?: NotifV2NextLive;
  receive?: NotifV2ReceiveLine[];
  lang?: Lang;
  showProgrammeFilter?: boolean;
  showPhoneCard?: boolean;
  olderHref?: string | null;
  markAllAction?: () => Promise<void>;
}) {
  const t = COPY[lang] ?? COPY.fr;
  const [filter, setFilter] = useState<Filter>('all');
  const [pending, startTransition] = useTransition();
  const [locallyRead, setLocallyRead] = useState(false);

  const shown = useMemo(
    () =>
      items
        .map((i) => (locallyRead && !i.read_at ? { ...i, read_at: new Date().toISOString() } : i))
        .filter((i) => filter === 'all' || filterOf(i.category) === filter),
    [items, filter, locallyRead],
  );
  const grouped = PERIOD_ORDER.map((id) => ({ id, rows: shown.filter((i) => (i.period ?? 'earlier') === id) })).filter(
    (g) => g.rows.length > 0,
  );
  const unread = locallyRead ? 0 : unreadCount;

  const chips: Array<{ id: Filter; label: string; Icon?: LucideIcon }> = [
    { id: 'all', label: `${t.all} · ${unread}` },
    { id: 'live', label: t.lives, Icon: Radio },
    ...(showProgrammeFilter ? [{ id: 'programme' as const, label: t.programme, Icon: Route }] : []),
    { id: 'content', label: t.content, Icon: CirclePlay },
    { id: 'account', label: t.account, Icon: UserRound },
  ];

  return (
    <div className="mx-auto max-w-[1180px] min-w-0 space-y-6 pb-16 pt-3 md:space-y-8 md:px-8 md:pt-10">
      <section className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <p className="fm-kicker">{t.kicker}</p>
          <h1 className="hero-signature-title mt-2 text-[2.6rem] text-luxury-ink md:text-[4rem]">{t.title}</h1>
          <p className="hero-signature-subtitle mt-2 text-[14px]">{t.subtitle(unread)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-luxury-ghost !px-4 !py-2.5"
            disabled={pending || unread === 0 || !markAllAction}
            onClick={() =>
              startTransition(async () => {
                if (!markAllAction) return;
                await markAllAction();
                setLocallyRead(true);
              })
            }
          >
            <CheckCheck size={15} />
            {t.markAll}
          </button>
          <Link href="/compte/preferences" className="btn-luxury-ghost !px-4 !py-2.5">
            <Settings2 size={15} />
            {t.prefs}
          </Link>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <div className="flex w-max gap-2 md:w-auto md:flex-wrap">
              {chips.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`fm-chip ${filter === id ? 'fm-chip--active' : ''}`}
                  aria-pressed={filter === id}
                  onClick={() => setFilter(id)}
                >
                  {Icon ? <Icon size={14} /> : null}
                  {label}
                </button>
              ))}
            </div>
          </div>

          <section className="glass-card glass-card--kpi p-3 md:p-4">
            {grouped.length === 0 ? (
              <p className="px-3 py-6 text-[14px] text-luxury-muted">{t.empty}</p>
            ) : (
              grouped.map((g, idx) => (
                <div key={g.id}>
                  <p
                    className={`px-3 pb-2 ${idx === 0 ? 'pt-2' : 'pt-5'} text-[11px] font-semibold uppercase tracking-[0.2em] text-luxury-soft`}
                  >
                    {t.periods[g.id]}
                  </p>
                  <ul className="space-y-1">
                    {g.rows.map((row) => (
                      <NotifRow key={row.id} row={row} />
                    ))}
                  </ul>
                </div>
              ))
            )}
            {olderHref ? (
              <div className="px-3 pb-2 pt-4">
                <Link href={olderHref} className="text-[12px] font-semibold uppercase tracking-[0.14em] text-luxury-orange">
                  {t.older}
                </Link>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-5">
          <div className="glass-card glass-card--kpi fm-dark glass-card--dark overflow-hidden p-6 text-white">
            <p className="fm-kicker !text-white/55">{t.nextLive}</p>
            {nextLive ? (
              <>
                <p className="mt-3 text-[20px] font-semibold leading-snug">{nextLive.title}</p>
                <p className="mt-1 text-[13.5px] text-white/65">{nextLive.whenLabel}</p>
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/[0.08] px-4 py-3 ring-1 ring-white/10">
                  <span className="text-[#f3c58e]">
                    <Timer size={18} />
                  </span>
                  <p className="text-[13px] text-white/80">
                    {t.startsAt} <b className="font-semibold text-white">{nextLive.startTime}</b>
                    {nextLive.inLabel ? ` (${nextLive.inLabel})` : ''} · {t.linkOpen}
                  </p>
                </div>
                <Link href={nextLive.href} className="btn-luxury-primary mt-4 w-full">
                  {t.join}
                </Link>
              </>
            ) : (
              <p className="mt-3 text-[13.5px] leading-relaxed text-white/75">{t.noLive}</p>
            )}
          </div>

          {receive.length ? (
            <div className="glass-card glass-card--kpi p-6">
              <p className="text-[15px] font-semibold text-luxury-ink">{t.receive}</p>
              <ul className="mt-3 space-y-2.5 text-[13.5px] text-luxury-ink">
                {receive.map((line) => {
                  const Icon = RECEIVE_ICONS[line.icon];
                  return (
                    <li key={line.label} className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2">
                        <Icon size={15} strokeWidth={2} className="text-luxury-orange" />
                        {line.label}
                      </span>
                      <span className="text-[12px] text-luxury-muted">{line.detail}</span>
                    </li>
                  );
                })}
              </ul>
              <Link href="/compte/preferences" className="btn-luxury-gold mt-5 w-full">
                {t.manage}
              </Link>
            </div>
          ) : null}

          {showPhoneCard ? (
            <div className="glass-card glass-card--kpi flex items-start gap-3 p-5">
              <span className="kpi-icon-wrap kpi-icon-wrap--amber !h-10 !w-10">
                <Smartphone size={18} />
              </span>
              <div>
                <p className="text-[14px] font-semibold text-luxury-ink">{t.phoneTitle}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-luxury-muted">{t.phoneBody}</p>
                <Link
                  href="/compte/preferences#telephone"
                  className="mt-2 inline-block text-[12px] font-semibold uppercase tracking-[0.14em] text-luxury-orange"
                >
                  {t.phoneCta}
                </Link>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
