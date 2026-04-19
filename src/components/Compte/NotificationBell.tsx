'use client';

import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { markAllNotificationsReadAction, markNotificationReadAction } from '@/app/compte/actions';

export type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell({ items }: { items: NotificationRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const unread = items.filter((i) => !i.read_at).length;

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-white/45 bg-white/30 px-3 py-2 text-luxury-ink/85 backdrop-blur-md transition hover:bg-white/50 [&::-webkit-details-marker]:hidden">
        <Bell size={18} aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">Notifications</span>
        {unread > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-luxury-orange to-luxury-orange-deep px-1.5 text-[10px] font-bold text-white shadow-md shadow-orange-500/30">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border border-white/40 bg-white/55 py-2 shadow-[0_24px_56px_rgba(15,23,42,0.14)] backdrop-blur-[20px]">
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-luxury-soft">Aucune notification.</p>
        ) : (
          <>
            <div className="flex justify-end border-b border-white/35 px-3 pb-2">
              <button
                type="button"
                disabled={pending || unread === 0}
                onClick={() =>
                  startTransition(async () => {
                    await markAllNotificationsReadAction();
                    router.refresh();
                  })
                }
                className="text-[11px] font-semibold text-luxury-orange underline-offset-2 hover:underline disabled:opacity-40"
              >
                Tout marquer lu
              </button>
            </div>
            <ul className="max-h-[min(60vh,22rem)] overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className="border-b border-white/25 last:border-0">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        if (!n.read_at) await markNotificationReadAction(n.id);
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
