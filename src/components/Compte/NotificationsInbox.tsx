'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { markAllNotificationsReadAction, markNotificationReadAction } from '@/app/compte/actions';
import { GlassCard } from '@/components/ui/GlassCard';
import { createClient } from '@/lib/supabase/client';
import { isClientVisibleNotificationKind } from '@/lib/notifications/client-notification-filter';

import type { NotificationRow } from './NotificationBell';
import { subscribeToUserNotifications } from './notificationRealtime';

type Props = {
  userId: string;
  items: NotificationRow[];
  dateLocale: string;
  labels: {
    title: string;
    empty: string;
    markAll: string;
    prefs: string;
  };
};

export function NotificationsInbox({ userId, items, dateLocale, labels }: Props) {
  const router = useRouter();
  const [localItems, setLocalItems] = useState(() =>
    items.filter((item) => isClientVisibleNotificationKind(item.kind)),
  );
  const [pending, startTransition] = useTransition();
  const unread = localItems.filter((i) => !i.read_at).length;

  useEffect(() => {
    setLocalItems(items.filter((item) => isClientVisibleNotificationKind(item.kind)));
  }, [items]);

  // Rafraîchit le layout (badge sidebar) après marquage auto côté serveur au chargement.
  useEffect(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    const supabase = createClient();
    return subscribeToUserNotifications(supabase, userId, (row) => {
      if (!isClientVisibleNotificationKind(row.kind)) return;
      setLocalItems((current) => [row, ...current.filter((item) => item.id !== row.id)].slice(0, 50));
    });
  }, [userId]);

  return (
    <GlassCard className="p-5 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-luxury-ink">{labels.title}</h1>
          {unread > 0 ? (
            <p className="mt-1 text-sm text-luxury-muted">
              {unread} non lue{unread > 1 ? 's' : ''}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/compte/profil#notifications"
            className="text-xs font-semibold uppercase tracking-[0.12em] text-luxury-orange underline-offset-4 hover:underline"
          >
            {labels.prefs}
          </Link>
          <button
            type="button"
            disabled={pending || unread === 0}
            onClick={() =>
              startTransition(async () => {
                await markAllNotificationsReadAction();
                const now = new Date().toISOString();
                setLocalItems((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? now })));
                router.refresh();
              })
            }
            className="text-xs font-semibold text-luxury-orange underline-offset-2 hover:underline disabled:opacity-40"
          >
            {labels.markAll}
          </button>
        </div>
      </div>

      {localItems.length === 0 ? (
        <p className="mt-6 text-center text-sm text-luxury-muted">{labels.empty}</p>
      ) : (
        <ul className="mt-6 divide-y divide-white/35">
          {localItems.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    if (!n.read_at) await markNotificationReadAction(n.id);
                    setLocalItems((current) =>
                      current.map((item) =>
                        item.id === n.id ? { ...item, read_at: item.read_at ?? new Date().toISOString() } : item,
                      ),
                    );
                    router.refresh();
                  })
                }
                className={`w-full py-4 text-left text-sm transition hover:bg-white/30 ${
                  n.read_at ? 'text-luxury-soft' : 'text-luxury-ink'
                }`}
              >
                <span className="font-semibold">{n.title}</span>
                {n.body ? <span className="mt-1 block text-xs leading-relaxed text-luxury-muted">{n.body}</span> : null}
                <span className="mt-2 block text-[10px] uppercase tracking-wider text-luxury-soft">
                  {new Date(n.created_at).toLocaleString(dateLocale)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
