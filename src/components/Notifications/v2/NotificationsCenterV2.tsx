'use client';

import Link from 'next/link';
import { BookOpen, CalendarX, CheckCheck, CirclePlay, CreditCard, Gift, Radio, Route, Settings2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { NotifV2Item } from './demo-data';

const ICONS = {
  live: { Icon: Radio, wrap: 'kpi-icon-wrap--orange' },
  programme: { Icon: Route, wrap: 'kpi-icon-wrap--logo' },
  content: { Icon: CirclePlay, wrap: 'kpi-icon-wrap--green' },
  cancel: { Icon: CalendarX, wrap: 'kpi-icon-wrap--rose' },
  account: { Icon: CreditCard, wrap: 'kpi-icon-wrap--blue' },
  community: { Icon: Gift, wrap: 'kpi-icon-wrap--logo' },
  blog: { Icon: BookOpen, wrap: 'kpi-icon-wrap--amber' },
} as const;

function periodOf(iso: string, now = new Date()): 'today' | 'yesterday' | 'week' | 'earlier' {
  const d = new Date(iso);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const diff = start.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (diff === 0) return 'today';
  if (diff === 86400000) return 'yesterday';
  if (diff < 7 * 86400000) return 'week';
  return 'earlier';
}

const PERIODS: Array<{ id: ReturnType<typeof periodOf>; label: string }> = [
  { id: 'today', label: 'Aujourd’hui' },
  { id: 'yesterday', label: 'Hier' },
  { id: 'week', label: 'Cette semaine' },
  { id: 'earlier', label: 'Plus tôt' },
];

export function NotificationsCenterV2({
  items,
  unreadCount,
  nextLiveLabel = 'Aucun live à venir',
}: {
  items: NotifV2Item[];
  unreadCount: number;
  nextLiveLabel?: string;
}) {
  const [filter, setFilter] = useState<'all' | NotifV2Item['category']>('all');
  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  );
  const grouped = PERIODS.map((p) => ({ ...p, rows: filtered.filter((i) => periodOf(i.created_at) === p.id) })).filter(
    (g) => g.rows.length > 0,
  );

  return (
    <div className="mx-auto max-w-[1180px] min-w-0 space-y-6 pb-16 pt-3 md:space-y-8 md:px-8 md:pt-10">
      <section className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <p className="fm-kicker">Espace client</p>
          <h1 className="hero-signature-title mt-2 text-[2.6rem] text-luxury-ink md:text-[4rem]">Notifications</h1>
          <p className="hero-signature-subtitle mt-2 text-[14px]">
            {unreadCount} nouvelles · tout ce qui compte, au même endroit.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/compte/notifications?mark=all" className="btn-luxury-ghost !px-4 !py-2.5">
            <CheckCheck size={15} /> Tout marquer comme lu
          </Link>
          <Link href="/compte/preferences" className="btn-luxury-ghost !px-4 !py-2.5">
            <Settings2 size={15} /> Préférences
          </Link>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <div className="flex w-max gap-2 md:w-auto md:flex-wrap">
            <button type="button" className={`fm-chip ${filter === 'all' ? 'fm-chip--active' : ''}`} onClick={() => setFilter('all')}>
              Tout · {unreadCount}
            </button>
            <button type="button" className={`fm-chip ${filter === 'live' ? 'fm-chip--active' : ''}`} onClick={() => setFilter('live')}>
              Lives
            </button>
            <button type="button" className={`fm-chip ${filter === 'content' ? 'fm-chip--active' : ''}`} onClick={() => setFilter('content')}>
              Vidéos & blog
            </button>
            <button type="button" className={`fm-chip ${filter === 'account' ? 'fm-chip--active' : ''}`} onClick={() => setFilter('account')}>
              Compte
            </button>
          </div>

          <section className="glass-card glass-card--kpi p-3 md:p-4">
            {grouped.map((g) => (
              <div key={g.id}>
                <p className="px-3 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">{g.label}</p>
                <ul className="space-y-1">
                  {g.rows.map((row) => {
                    const { Icon, wrap } = ICONS[row.category];
                    return (
                      <li
                        key={row.id}
                        className={`relative flex gap-4 rounded-[1.25rem] p-4 md:p-5 ${row.read_at ? '' : 'bg-white shadow-[0_10px_26px_rgba(31,27,22,0.08)]'}`}
                      >
                        <span className={`kpi-icon-wrap ${wrap} !h-11 !w-11 shrink-0`}>
                          <Icon size={19} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14.5px] leading-snug font-semibold text-luxury-ink">{row.title}</p>
                          <p className="mt-1 text-[13.5px] leading-relaxed text-luxury-muted">{row.body}</p>
                          {row.thumbs?.length ? (
                            <div className="mt-3 flex items-center gap-2">
                              {row.thumbs.map((src) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img key={src} src={src} alt="" className="h-14 w-20 rounded-xl object-cover" />
                              ))}
                            </div>
                          ) : null}
                          {row.action_url && row.action_label ? (
                            <div className="mt-3">
                              <Link href={row.action_url} className="btn-luxury-primary !px-5 !py-2.5 !text-[10px]">
                                {row.action_label}
                              </Link>
                            </div>
                          ) : null}
                        </div>
                        {!row.read_at ? <span className="fm-dot absolute left-2 top-1/2 -translate-y-1/2" /> : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="glass-card glass-card--kpi rounded-[1.75rem] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">Prochain live</p>
            <p className="mt-2 text-[15px] font-semibold text-luxury-ink">{nextLiveLabel}</p>
          </div>
          <div className="glass-card glass-card--kpi rounded-[1.75rem] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">Tu reçois…</p>
            <p className="mt-2 text-[13.5px] text-luxury-muted">Rappels des lives (veille et 1 h avant), nouveautés du jour, et « Ta semaine » le dimanche.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
