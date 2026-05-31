'use client';

import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { markAllNotificationsReadAction, markNotificationReadAction } from '@/app/compte/actions';
import { createClient } from '@/lib/supabase/client';

import { subscribeToUserNotifications } from './notificationRealtime';

export type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell({ userId, items }: { userId: string; items: NotificationRow[] }) {
  const router = useRouter();
  const [localItems, setLocalItems] = useState(items);
  const [pending, startTransition] = useTransition();
  const unread = localItems.filter((i) => !i.read_at).length;

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  useEffect(() => {
    const supabase = createClient();
    return subscribeToUserNotifications(supabase, userId, (row) => {
      setLocalItems((current) => [row, ...current.filter((item) => item.id !== row.id)].slice(0, 25));
    });
  }, [userId]);

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-white/70 bg-white/45 px-3 py-2 text-luxury-ink shadow-sm backdrop-blur-xl transition hover:bg-white/65 [&::-webkit-details-marker]:hidden">
        <Bell size={18} aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">Notifications</span>
        {unread > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-luxury-orange to-luxury-orange-deep px-1.5 text-[10px] font-bold text-white shadow-md shadow-orange-500/30">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </summary>
      <div className="absolute right-0 z-50 mt-2 max-w-[calc(100vw-2rem)] w-[22rem] rounded-[2rem] border border-white/70 bg-white/40 py-2 shadow-[0_24px_56px_rgba(29,29,31,0.1)] backdrop-blur-xl">
        {localItems.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-luxury-muted">Aucune notification.</p>
        ) : (
          <>
            <div className="flex justify-end border-b border-white/35 px-3 pb-2">
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
                className="text-[11px] font-semibold text-luxury-orange underline-offset-2 hover:underline disabled:opacity-40"
              >
                Tout marquer lu
              </button>
            </div>
            <ul className="max-h-[min(60vh,22rem)] overflow-y-auto">
              {localItems.map((n) => (
                <li key={n.id} className="border-b border-white/25 last:border-0">
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
                    className={`w-full px-4 py-3 text-left text-sm transition hover:bg-white/40 ${
                      n.read_at ? 'text-luxury-soft' : 'text-luxury-ink'
                    }`}
                  >
                    <span className="font-semibold">{n.title}</span>
                    {n.body ? (
                      <span className="mt-1 block text-xs leading-relaxed text-luxury-muted">{n.body}</span>
                    ) : null}
                    <span className="mt-2 block text-[10px] uppercase tracking-wider text-luxury-soft">
                      {new Date(n.created_at).toLocaleString('fr-FR')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </details>
  );
}
